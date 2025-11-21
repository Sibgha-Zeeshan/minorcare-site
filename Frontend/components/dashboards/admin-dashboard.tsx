"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase"
import type { User } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

interface AssignmentSummary {
  id: string
  created_at: string
  student?: User
  sponsor?: User
}

export default function AdminDashboard() {
  const supabase = createClient()
  const [students, setStudents] = useState<User[]>([])
  const [mentors, setMentors] = useState<User[]>([])
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState("")
  const [selectedMentor, setSelectedMentor] = useState("")
  const [searchStudent, setSearchStudent] = useState("")
  const [searchMentor, setSearchMentor] = useState("")
  const [error, setError] = useState<string>("")

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [studentsRes, mentorsRes, assignmentsRes] = await Promise.all([
        supabase.from("users").select("*").eq("role", "student").order("created_at", { ascending: false }),
        supabase.from("users").select("*").eq("role", "sponsor").order("created_at", { ascending: false }),
        supabase
          .from("chats")
          .select(
            `
          id,
          created_at,
          student:users!student_id(id, full_name, email, role, profile_image_url),
          sponsor:users!sponsor_id(id, full_name, email, role, profile_image_url)
        `,
          )
          .order("created_at", { ascending: false }),
      ])

      if (studentsRes.error || mentorsRes.error || assignmentsRes.error) {
        console.error("Admin data errors:", {
          students: studentsRes.error,
          mentors: mentorsRes.error,
          assignments: assignmentsRes.error,
        })
        throw new Error("Failed to fetch admin data")
      }

      setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : [])
      setMentors(Array.isArray(mentorsRes.data) ? mentorsRes.data : [])

      setAssignments(
        Array.isArray(assignmentsRes.data)
          ? assignmentsRes.data.map((a: any) => ({
              id: a.id,
              created_at: a.created_at,
              student: Array.isArray(a.student) ? a.student[0] : a.student,
              sponsor: Array.isArray(a.sponsor) ? a.sponsor[0] : a.sponsor,
            }))
          : []
      )
    } catch (err) {
      console.error("Error loading admin data:", err)
      setError("Failed to load data. Please refresh.")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  const assignmentByStudentId = useMemo(() => {
    const map = new Map<string, AssignmentSummary>()
    assignments.forEach((assignment) => {
      if (assignment.student?.id) {
        map.set(assignment.student.id, assignment)
      }
    })
    return map
  }, [assignments])

  const filteredStudents = useMemo(() => {
    return students.filter((student) => student.full_name.toLowerCase().includes(searchStudent.toLowerCase()))
  }, [students, searchStudent])

  const filteredMentors = useMemo(() => {
    return mentors.filter((mentor) => mentor.full_name.toLowerCase().includes(searchMentor.toLowerCase()))
  }, [mentors, searchMentor])

  const handleAssign = async () => {
    if (!selectedStudent || !selectedMentor) {
      setError("Please choose both a student and a mentor.")
      return
    }

    setAssigning(true)
    setError("")

    try {
      const existingAssignment = assignmentByStudentId.get(selectedStudent)

      if (existingAssignment) {
        const { error: updateError } = await supabase
          .from("chats")
          .update({ sponsor_id: selectedMentor })
          .eq("id", existingAssignment.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from("chats").insert({
          student_id: selectedStudent,
          sponsor_id: selectedMentor,
        })

        if (insertError) throw insertError
      }

      setSelectedStudent("")
      setSelectedMentor("")
      await loadData()
    } catch (err) {
      console.error("Error assigning mentor:", err)
      setError("Assignment failed. Please try again.")
    } finally {
      setAssigning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Students</p>
            <p className="text-2xl font-semibold">{students.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Mentors</p>
            <p className="text-2xl font-semibold">{mentors.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active Pairings</p>
            <p className="text-2xl font-semibold">{assignments.length}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assign Mentor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Student</label>
              <Input
                placeholder="Search students..."
                className="mt-1"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
              />
              <select
                className="mt-3 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
              >
                <option value="">Select student</option>
                {filteredStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} {assignmentByStudentId.has(student.id) ? "(Assigned)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Mentor</label>
              <Input
                placeholder="Search mentors..."
                className="mt-1"
                value={searchMentor}
                onChange={(e) => setSearchMentor(e.target.value)}
              />
              <select
                className="mt-3 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                value={selectedMentor}
                onChange={(e) => setSelectedMentor(e.target.value)}
              >
                <option value="">Select mentor</option>
                {filteredMentors.map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>
                    {mentor.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button onClick={handleAssign} disabled={assigning} className="rounded-lg">
            {assigning ? "Assigning..." : "Assign Mentor"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assignments yet.</p>
          ) : (
            assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between rounded-lg border border-border p-4"
              >
                <div>
                  <p className="text-sm font-semibold">{assignment.student?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{assignment.student?.email}</p>
                </div>
                <div className="hidden md:block">
                  <Separator orientation="vertical" className="h-8" />
                </div>
                <div className="mt-2 md:mt-0">
                  <p className="text-sm font-semibold">{assignment.sponsor?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{assignment.sponsor?.email}</p>
                </div>
                <div className="mt-2 md:mt-0 text-xs text-muted-foreground">
                  Assigned {new Date(assignment.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

