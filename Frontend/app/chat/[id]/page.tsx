"use client";

import type React from "react";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Message, User } from "@/types";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import MessageBubble from "@/components/chat/message-bubble";
import AudioRecorder from "@/components/chat/audio-recorder";

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const chatId = params.id as string;
  const supabase = createClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (chatId && user) {
      loadMessages();
      const unsubscribe = subscribeToMessages();
      return () => unsubscribe?.();
    }
  }, [chatId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    try {
      const result = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      const data = result.data || [];
      setMessages(data);
      if (data.length > 0) {
        await loadUsers(data);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (msgs: Message[]) => {
    const userIds = new Set(msgs.map((m) => m.sender_id));
    const usersMap: Record<string, User> = {};

    for (const userId of userIds) {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (data) {
        usersMap[userId] = data;
      }
    }

    setUsers(usersMap);
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload: RealtimePostgresChangesPayload<Message>) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);

          // Load the user for this message
          const { data } = await supabase
            .from("users")
            .select("*")
            .eq("id", newMessage.sender_id)
            .single();

          if (data) {
            setUsers((prev) => ({ ...prev, [newMessage.sender_id]: data }));
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          const updatedMessage = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !user) return;

    setSending(true);

    try {
      await supabase.from("messages").insert({
        chat_id: chatId,
        sender_id: user.id,
        message_type: "text",
        text_original: textInput,
        language_original: users[user.id]?.language_preference || "english",
      });

      setTextInput("");
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleAudioUpload = async (audioBlob: Blob) => {
    if (!user) return;

    setUploadingAudio(true);

    try {
      const fileName = `audio_${Date.now()}.webm`;
      const { error } = await supabase.storage
        .from("messages")
        .upload(fileName, audioBlob);

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from("messages")
        .getPublicUrl(fileName);

      await supabase.from("messages").insert({
        chat_id: chatId,
        sender_id: user.id,
        message_type: "audio",
        audio_url: publicData.publicUrl,
        language_original: users[user.id]?.language_preference || "english",
      });
    } catch (err) {
      console.error("Error uploading audio:", err);
      alert("Failed to upload audio");
    } finally {
      setUploadingAudio(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-linear-to-b from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="px-2"
            >
              ← Back
            </Button>
            <h1 className="text-lg font-semibold">Chat</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/profile")}
            className="rounded-lg"
          >
            Profile
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full p-4">
        <div className="space-y-2">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.sender_id === user?.id}
                sender={users[msg.sender_id]}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-white shadow-lg">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={handleSendText} className="flex gap-2">
            <Input
              type="text"
              placeholder="Type a message..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              disabled={sending || uploadingAudio}
              className="flex-1 rounded-lg h-11"
            />
            <Button
              type="submit"
              disabled={sending || uploadingAudio || !textInput.trim()}
              className="rounded-lg h-11 px-6"
            >
              Send
            </Button>
          </form>

          <div className="mt-3 flex items-center gap-2">
            <AudioRecorder
              onUpload={handleAudioUpload}
              disabled={sending || uploadingAudio}
            />
            {uploadingAudio && (
              <span className="text-xs text-blue-600">Uploading audio...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
