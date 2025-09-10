import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { Message } from '../types';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, message: { content: string; messageType?: string }) => void;
  onMessage: (callback: (message: Message) => void) => void;
  offMessage: () => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string) => void;
}

export const useSocket = (): UseSocketReturn => {
  const { isAuthenticated, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messageCallbackRef = useRef<((message: Message) => void) | null>(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      // 创建socket连接
      const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
      });

      socketRef.current = socket;

      // 连接事件
      socket.on('connect', () => {
        console.log('Socket连接成功');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('Socket连接断开');
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket连接错误:', error);
        setIsConnected(false);
      });

      // 接收消息
      socket.on('receive_message', (message: Message) => {
        if (messageCallbackRef.current) {
          messageCallbackRef.current(message);
        }
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      };
    }
  }, [isAuthenticated, token]);

  const joinRoom = (roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join_room', roomId);
    }
  };

  const leaveRoom = (roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_room', roomId);
    }
  };

  const sendMessage = (roomId: string, message: { content: string; messageType?: string }) => {
    if (socketRef.current) {
      socketRef.current.emit('send_message', {
        roomId,
        ...message,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const onMessage = (callback: (message: Message) => void) => {
    messageCallbackRef.current = callback;
  };

  const offMessage = () => {
    messageCallbackRef.current = null;
  };

  const on = (event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event: string) => {
    if (socketRef.current) {
      socketRef.current.off(event);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    onMessage,
    offMessage,
    on,
    off,
  };
};

export default useSocket;