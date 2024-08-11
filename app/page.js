"use client";
import { Box, Stack, TextField, Button, Typography } from "@mui/material";
import { useState, useRef, useEffect } from "react";
import SendIcon from '@mui/icons-material/Send';

export default function Home() {
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");
  
  const sendMessage = async () => {
    if (!message.trim()) return; // Prevent sending empty messages

    const userMessage = { role: "user", parts: [{ text: message }] };
    
    setHistory((history) => [
      ...history, 
      userMessage,
      { role: "model", parts: [{ text: "" }] } // Placeholder for the bot's response
    ]);
    setMessage('');

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([...history, userMessage])
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let modelMessage = '';

      // Read stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        modelMessage += chunk;

        // Update history with streamed response in real-time
        setHistory((history) => [
          ...history.slice(0, -1),
          { role: "model", parts: [{ text: modelMessage }] }
        ]);
      }
      
    } catch (error) {
      console.error("Failed to send message:", error);
      setHistory((history) => [
        ...history.slice(0, -1), 
        { role: "model", parts: [{ text: "Sorry, something went wrong. Please try again." }] }
      ]);
    }
  };
  
  const chatContainerRef = useRef(null);
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [history]);

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        overflow: 'hidden'
      }}
    >
      <Box
        ref={chatContainerRef}
        sx={{
          width: '100%',
          flexGrow: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: 10,
          gap: 2
        }}
      >
        {/* Initial bot message displayed independently */}
        <Box
          sx={{
            alignSelf: 'flex-start',
            bgcolor: 'black',
            borderRadius: 10,
            p: 2,
            mb: 2,
            color: 'white',
          }}
        >
          <Typography>Hi there! I'm your Personal Health Assistant, here to help you stay on top of your health and wellness. Whether you need a reminder to take your meds, some tips for a healthier lifestyle, or just someone to track your progress, I've got you covered. Let’s work together to make your wellness journey as smooth and successful as possible!</Typography>
        </Box>
        
        {/* Render chat history */}
        {history.map((textObject, index) => (
          <Box
            key={index}
            sx={{
              alignSelf: textObject.role === 'user' ? 'flex-end' : 'flex-start',
              bgcolor: textObject.role === 'user' ? 'purple' : 'black',
              color: 'white',
              borderRadius: 10,
              p: 2,
              maxWidth: '70%'
            }}
          >
            <Typography>{textObject.parts[0].text}</Typography>
          </Box>
        ))}
      </Box>

      {/* Input area */}
      <Stack
        direction="row"
        spacing={2}
        sx={{
          width: '70%',
          p: 2,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider'
        }}
      >
        <TextField 
          placeholder='Message HUIT Bot' 
          value={message}
          onChange={(e) => setMessage(e.target.value)} 
          onKeyDown={handleKeyDown}
          fullWidth
          sx={{border: '3px solid purple', borderRadius: 10, '& fieldset': { border: 'none' }}}
        />
        <Button 
          sx={{backgroundColor: 'black', borderRadius: '50%', color: 'white', '&:hover': {backgroundColor: 'black'}}}  
          onClick={sendMessage}
        >
          <SendIcon/>
        </Button>
      </Stack>
    </Box>
  );
}



/*'use client'

import { Box, Button, Stack, TextField } from '@mui/material'
import { useState, useRef, useEffect} from 'react'

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the library support assistant. How can I help you today?",
    },
  ])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState([])

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true)
    
    setHistory((history) => [ ...history, {role: "user", parts: [{text: message}]} ])
    setMessage('')
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ])
  
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([ ...history, {role: "user", parts: [{text: message}]} ]),
      })

      const data = await response.json()

      setHistory((history) => [ ...history, {role: "model", parts: [{text: data}] }])
  
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
  
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
  
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ]
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ])
    }
    setIsLoading(false)
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  const messagesEndRef = useRef(null)

const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
}

useEffect(() => {
  scrollToBottom()
}, [messages])

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        direction={'column'}
        width="500px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
      >
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {history.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? 'primary.main'
                    : 'secondary.main'
                }
                color="white"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        <Stack direction={'row'} spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button 
            variant="contained" 
            onClick={sendMessage}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}*/