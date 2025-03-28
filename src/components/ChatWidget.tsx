
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, ChevronDown, MicIcon, StethoscopeIcon, FileText } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Common questions and answers for the chat
const commonQAs = [
  {
    question: "What is PrecisionNote?",
    answer: "PrecisionNote is an AI-powered clinical documentation assistant that helps healthcare professionals save time on documentation while improving accuracy and patient care."
  },
  {
    question: "How much time can I save with PrecisionNote?",
    answer: "Healthcare professionals using PrecisionNote typically reduce their documentation time by up to 70%, allowing more focus on patient care."
  },
  {
    question: "Is PrecisionNote HIPAA compliant?",
    answer: "Yes, PrecisionNote is fully HIPAA compliant with enterprise-grade security protocols to protect patient data."
  },
  {
    question: "Do you offer a free trial?",
    answer: "Yes! We offer a free trial so you can experience the benefits of PrecisionNote before committing to a subscription."
  },
  {
    question: "What EHR systems does PrecisionNote integrate with?",
    answer: "PrecisionNote integrates with all major electronic health record systems for seamless workflow integration."
  },
  {
    question: "How accurate is the AI transcription?",
    answer: "Our AI transcription has a 95%+ accuracy rate for medical terminology and context, significantly higher than general-purpose transcription services."
  },
  {
    question: "Can I customize templates for my specialty?",
    answer: "Absolutely! PrecisionNote offers customizable templates tailored to different medical specialties and workflow requirements."
  },
  {
    question: "What subscription plans do you offer?",
    answer: "We offer Free, Basic, Professional, and Enterprise plans to suit various needs and organization sizes. Visit our Pricing section for details."
  },
  {
    question: "How does the interactive transcript mode work?",
    answer: "Interactive transcript mode lets you drag and drop specific parts of the conversation directly into the structured clinical note, making it easy to build accurate documentation."
  },
  {
    question: "Can PrecisionNote extract clinical results automatically?",
    answer: "Yes! PrecisionNote automatically identifies and extracts key clinical measurements like vital signs, lab values, and diagnoses from your conversations into a dedicated results panel."
  },
  {
    question: "How do I use the clinical results feature?",
    answer: "After transcribing your conversation, click 'Convert to Structured Note' and the system will automatically extract clinical values into the 'Clinical Results' tab."
  }
];

type Message = {
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "👋 Hi there! How can I help you with PrecisionNote today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "How does the interactive transcript mode work?",
    "Can PrecisionNote extract clinical results?",
    "What EHR systems do you integrate with?"
  ]);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = () => {
    if (input.trim() === "") return;

    // Add user message
    const userMessage: Message = {
      sender: "user",
      text: input,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Generate response
    setTimeout(() => {
      const botResponse = findBestMatch(input);
      const botMessage: Message = {
        sender: "bot",
        text: botResponse,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, botMessage]);
      
      // Update suggested questions based on the conversation
      updateSuggestedQuestions(input, botResponse);
    }, 500);
  };

  const updateSuggestedQuestions = (userQuery: string, botResponse: string) => {
    // Update suggested questions based on the recent conversation context
    const lowerQuery = userQuery.toLowerCase();
    
    if (lowerQuery.includes("transcript") || lowerQuery.includes("conversation")) {
      setSuggestedQuestions([
        "How does the interactive transcript mode work?",
        "Can PrecisionNote extract clinical results?",
        "How do I use the clinical results feature?"
      ]);
    } else if (lowerQuery.includes("template") || lowerQuery.includes("note")) {
      setSuggestedQuestions([
        "What note templates are available?",
        "Can I customize templates for my specialty?",
        "How do I convert a transcript to a SOAP note?"
      ]);
    } else if (lowerQuery.includes("price") || lowerQuery.includes("cost") || lowerQuery.includes("subscription")) {
      setSuggestedQuestions([
        "What subscription plans do you offer?",
        "Do you offer a free trial?",
        "What features are in the Professional plan?"
      ]);
    } else {
      // Default questions
      setSuggestedQuestions([
        "How accurate is the AI transcription?",
        "Is PrecisionNote HIPAA compliant?",
        "What EHR systems do you integrate with?"
      ]);
    }
  };

  const findBestMatch = (question: string): string => {
    // Enhanced matching algorithm with medical documentation focus
    const lowerQuestion = question.toLowerCase();
    
    // Check for transcript-related queries specifically
    if (lowerQuestion.includes("extract") && (lowerQuestion.includes("result") || lowerQuestion.includes("value") || lowerQuestion.includes("clinical"))) {
      return "PrecisionNote automatically extracts clinical values like vital signs (BP, HR, temp), lab results, diagnoses, and other key measurements from transcribed conversations. Once you convert a transcript to a note, check the 'Clinical Results' tab to view all extracted measurements in an organized format.";
    }
    
    if (lowerQuestion.includes("interactive") && (lowerQuestion.includes("transcript") || lowerQuestion.includes("mode"))) {
      return "Interactive mode allows you to highlight parts of the transcript and drag them directly into specific sections of your structured note. After converting a transcript, toggle on 'Interactive Mode' and you can then select text from the conversation and drop it into the appropriate section of your SOAP note or other documentation.";
    }
    
    // Check for exact question matches
    for (const qa of commonQAs) {
      if (lowerQuestion.includes(qa.question.toLowerCase())) {
        return qa.answer;
      }
    }
    
    // Check for keyword matches
    if (lowerQuestion.includes("price") || lowerQuestion.includes("cost") || lowerQuestion.includes("pricing")) {
      return commonQAs.find(qa => qa.question.includes("subscription"))?.answer || 
             "We offer various pricing plans starting with a free tier. Please check our pricing section for more details.";
    }
    
    if (lowerQuestion.includes("trial") || lowerQuestion.includes("try")) {
      return commonQAs.find(qa => qa.question.includes("free trial"))?.answer || 
             "Yes, we offer a free trial so you can test out all features before subscribing.";
    }
    
    if (lowerQuestion.includes("security") || lowerQuestion.includes("privacy") || lowerQuestion.includes("hipaa")) {
      return commonQAs.find(qa => qa.question.includes("HIPAA"))?.answer || 
             "PrecisionNote is fully HIPAA compliant and employs enterprise-grade security to protect all patient data.";
    }
    
    if (lowerQuestion.includes("transcript") || lowerQuestion.includes("conversation")) {
      return "Our transcription system captures doctor-patient conversations with speaker diarization, automatically identifying who is speaking. You can then convert these transcripts to structured clinical notes, and our system will extract key clinical values automatically.";
    }
    
    // Default response
    return "I don't have specific information about that yet. For more details about our documentation features, please try asking about transcription, clinical results extraction, or interactive note editing.";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsExpanded(true);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    // Optionally auto-send the question
    // setInput("");
    // const userMessage: Message = {
    //   sender: "user",
    //   text: question,
    //   timestamp: new Date()
    // };
    // setMessages((prev) => [...prev, userMessage]);
    
    // setTimeout(() => {
    //   const botResponse = findBestMatch(question);
    //   const botMessage: Message = {
    //     sender: "bot",
    //     text: botResponse,
    //     timestamp: new Date()
    //   };
    //   setMessages((prev) => [...prev, botMessage]);
    //   updateSuggestedQuestions(question, botResponse);
    // }, 500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <Card className={cn(
          "mb-4 w-80 sm:w-96 shadow-lg transition-all duration-300 overflow-hidden",
          isExpanded ? "h-96" : "h-16"
        )}>
          <CardHeader className="p-3 border-b flex flex-row items-center justify-between space-y-0 bg-primary/5">
            <div className="flex items-center">
              <Avatar className="h-7 w-7 mr-2">
                <AvatarFallback className="bg-primary text-white text-xs">PN</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-semibold">PrecisionNote Assistant</div>
                <Badge variant="secondary" className="text-xs mt-1">Online</Badge>
              </div>
            </div>
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={toggleExpand}
              >
                <ChevronDown className={cn("h-4 w-4", !isExpanded && "rotate-180")} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={toggleChat}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          {isExpanded && (
            <>
              <CardContent className="p-3 h-[calc(100%-7rem)] overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex",
                        message.sender === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                  
                  {/* Suggested questions */}
                  {messages.length > 0 && messages[messages.length - 1].sender === "bot" && (
                    <div className="pt-2">
                      <div className="text-xs text-muted-foreground mb-2">Suggested questions:</div>
                      <div className="flex flex-wrap gap-2">
                        {suggestedQuestions.map((question, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs py-1 h-auto"
                            onClick={() => handleSuggestedQuestion(question)}
                          >
                            {question}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>
              <CardFooter className="p-3 pt-0">
                <div className="flex w-full items-center space-x-2">
                  <Input
                    ref={inputRef}
                    placeholder="Type your question..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={handleSend} disabled={input.trim() === ""}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </>
          )}
        </Card>
      )}
      
      <Button
        onClick={toggleChat}
        className={cn(
          "rounded-full h-14 w-14 shadow-lg transition-all hover:shadow-xl",
          isOpen ? "bg-muted" : "bg-primary"
        )}
      >
        <MessageCircle className={cn("h-6 w-6", isOpen ? "text-primary" : "text-white")} />
      </Button>
    </div>
  );
}
