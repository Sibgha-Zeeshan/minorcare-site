export const DEMO_STUDENTS = [
  {
    id: "student-1",
    email: "student@example.com",
    full_name: "Ahmed Khan",
    role: "student" as const,
    language_preference: "urdu",
  },
  {
    id: "student-2",
    email: "student2@example.com",
    full_name: "Zainab Ali",
    role: "student" as const,
    language_preference: "urdu",
  },
]

export const DEMO_MENTORS = [
  {
    id: "mentor-1",
    email: "mentor@example.com",
    full_name: "Sarah Johnson",
    role: "sponsor" as const,
    language_preference: "english",
  },
  {
    id: "mentor-2",
    email: "mentor2@example.com",
    full_name: "Emma Wilson",
    role: "sponsor" as const,
    language_preference: "english",
  },
]

export const DEMO_CONVERSATIONS = [
  {
    id: "conv-1",
    student_id: "student-1",
    mentor_id: "mentor-1",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "conv-2",
    student_id: "student-2",
    mentor_id: "mentor-1",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const DEMO_MESSAGES = [
  {
    id: "msg-1",
    chat_id: "conv-1",
    sender_id: "student-1",
    message_type: "text" as const,
    text_original: "السلام علیکم، میں انگریزی سیکھنا چاہتا ہوں",
    text_translated: "Hello, I want to learn English",
    audio_url: null,
    language_original: "urdu",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-2",
    chat_id: "conv-1",
    sender_id: "mentor-1",
    message_type: "text" as const,
    text_original: "That's great! Let's start with basic greetings.",
    text_translated: "یہ بہترین ہے! آئیے بنیادی سلامیوں سے شروع کریں۔",
    audio_url: null,
    language_original: "english",
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-3",
    chat_id: "conv-1",
    sender_id: "student-1",
    message_type: "text" as const,
    text_original: "شکریہ! میں تیار ہوں",
    text_translated: "Thank you! I'm ready",
    audio_url: null,
    language_original: "urdu",
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-4",
    chat_id: "conv-1",
    sender_id: "mentor-1",
    message_type: "audio" as const,
    text_original: null,
    text_translated: null,
    audio_url: "data:audio/webm;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAAA=", // Silent audio placeholder
    language_original: "english",
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-5",
    chat_id: "conv-1",
    sender_id: "student-1",
    message_type: "audio" as const,
    text_original: null,
    text_translated: null,
    audio_url: "data:audio/webm;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAAA=", // Silent audio placeholder
    language_original: "urdu",
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
]
