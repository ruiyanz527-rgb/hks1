import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { matchAPI, chatAPI } from '../utils/api';
import clsx from 'clsx';
import { io, Socket } from 'socket.io-client';
import { MessageSquare, Search } from 'lucide-react';

type MatchItem = {
  id: string;
  chatRoomId: string;
  user: {
    id?: string;
    _id?: string;
    name?: string;
    avatar?: string;
  };
  lastMessage?: {
    content?: string;
    createdAt?: string;
  };
};

type Message = {
  _id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

export default function Chat() {
  const navigate = useNavigate();
  const params = useParams<{ roomId?: string }>();

  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(params.roomId || null);
  // 最近一次从 Discover 进入时可带入的对方信息（可被后续真实数据覆盖）
  const [pendingPeer, setPendingPeer] = useState<{ roomId?: string; user?: { id?: string; _id?: string; name?: string; avatar?: string } } | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // 拉取匹配/会话列表
  useEffect(() => {
    const loadMatches = async () => {
      setLoadingMatches(true);
      try {
        const resp = await matchAPI.getMatches();
        const list = (resp.data?.matches || resp.data || []) as any[];
        // 标准化
        const normalized: MatchItem[] = list.map((m: any) => ({
          id: m._id || m.id,
          chatRoomId: m.chatRoomId || m.roomId || '',
          user: {
            id: m.user?.id || m.user?._id,
            _id: m.user?._id || m.user?.id,
            name: m.user?.name,
            avatar: m.user?.avatar,
          },
          lastMessage: m.lastMessage,
        }));
        setMatches(normalized);
      } catch {
        setMatches([]);
      } finally {
        setLoadingMatches(false);
      }
    };
    loadMatches();
  }, []);

  // 根据 URL 变化同步激活房间
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (params.roomId) {
      setActiveRoomId(params.roomId);
    }
  }, [params.roomId]);

  // 如果有激活的 roomId 但 matches 中没有该会话，则临时插入占位项
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!activeRoomId) return;
    setMatches((prev) => {
      const exists = prev.some((m) => String(m.chatRoomId) === String(activeRoomId));
      if (exists) return prev;
      const placeholder: MatchItem = {
        id: activeRoomId,
        chatRoomId: activeRoomId,
        user: {
          id: pendingPeer?.user?.id || pendingPeer?.user?._id,
          _id: pendingPeer?.user?._id || pendingPeer?.user?.id,
          name: pendingPeer?.user?.name || '对方',
          avatar: pendingPeer?.user?.avatar || '/avatar-placeholder.png',
        },
        lastMessage: undefined,
      };
      return [placeholder, ...prev];
    });
  }, [activeRoomId, pendingPeer]);

  // 加载消息
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeRoomId || !(chatAPI as any)?.getMessages) {
        setMessages([]);
        return;
      }
      setLoadingMessages(true);
      try {
        const resp = await (chatAPI as any).getMessages(activeRoomId, { page: 1, limit: 100 });
        const list = (resp.data?.messages || resp.messages || []) as Message[];
        setMessages(list);
      } catch {
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };
    loadMessages();
  }, [activeRoomId]);

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeRoomId]);

  // Socket 连接与房间加入
  useEffect(() => {
    if (!socketRef.current) {
      const base = (window as any)?._SOCKET_BASE || 'http://localhost:5000';
      const s = io(base, { transports: ['websocket'] });
      socketRef.current = s;

      s.on('receive_message', (data: any) => {
        if (!data?.roomId) return;
        // 如果是当前房间的消息则直接追加
        if (String(data.roomId) === String(activeRoomId)) {
          setMessages((prev) => [
            ...prev,
            {
              _id: `sock-${Date.now()}`,
              roomId: data.roomId,
              senderId: data.senderId || 'peer',
              content: data.content,
              createdAt: data.createdAt || new Date().toISOString(),
            } as any,
          ]);
        }
      });
    }

    if (socketRef.current && activeRoomId) {
      socketRef.current.emit('join_room', activeRoomId);
    }

    return () => {
      // 保持连接，避免频繁重连
    };
  }, [activeRoomId]);

  const handleClickAvatar = (rid: string) => {
    if (!rid) return;
    setActiveRoomId(rid);
    navigate(`/chat/${rid}`);
  };

  // 供 Discover 在导航前设置：window.__lastChatPeer = { roomId, user:{id,name,avatar} }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const w: any = window as any;
    if (w.__lastChatPeer) {
      setPendingPeer(w.__lastChatPeer);
      if (!activeRoomId && w.__lastChatPeer.roomId) {
        setActiveRoomId(w.__lastChatPeer.roomId);
      }
      w.__lastChatPeer = null;
    }
  }, []);

  // 发送消息：本地显示 + REST 落库 + Socket 广播
  const handleSend = async () => {
    const content = input.trim();
    if (!content || !activeRoomId) return;

    const localMsg: Message = {
      _id: `local-${Date.now()}`,
      roomId: activeRoomId,
      senderId: 'me',
      content,
      createdAt: new Date().toISOString(),
    } as any;
    setMessages((prev) => [...prev, localMsg]);
    setInput('');

    // REST
    if ((chatAPI as any)?.sendMessage) {
      try {
        setSending(true);
        const resp = await (chatAPI as any).sendMessage(activeRoomId, { content });
        const created = (resp.data?.message || resp.data?.data || null) as Message | null;
        if (created) {
          setMessages((prev) => [...prev, created]);
        }
      } catch {
        // 可加 toast
      } finally {
        setSending(false);
      }
    }

    // Socket 广播
    if (socketRef.current) {
      socketRef.current.emit('send_message', {
        roomId: activeRoomId,
        content,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const activeMatchUser = useMemo(() => {
    if (!activeRoomId) return null;
    return matches.find((m) => m.chatRoomId === activeRoomId)?.user || null;
  }, [matches, activeRoomId]);

  const filteredMatches = useMemo(() => {
    if (!sidebarSearch.trim()) return matches;
    const q = sidebarSearch.trim().toLowerCase();
    return matches.filter((m) => (m.user?.name || '').toLowerCase().includes(q));
  }, [matches, sidebarSearch]);

  return (
    <div className="h-screen w-full flex bg-white">
      {/* 左侧：会话列表 */}
      <aside className="w-[300px] border-r bg-gray-50 flex flex-col">
        <div className="px-4 py-3 border-b bg-white">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-semibold text-gray-900">消息</h2>
          </div>
          <div className="mt-3 relative">
            <input
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="w-full h-9 rounded-lg border px-9 text-sm bg-white"
              placeholder="搜索联系人"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingMatches ? (
            <div className="p-4 text-sm text-gray-500">加载中...</div>
          ) : filteredMatches.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">暂无会话，去发现页发起聊天</div>
          ) : (
            filteredMatches.map((m) => (
              <button
                key={m.id}
                onClick={() => handleClickAvatar(m.chatRoomId)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 focus:outline-none text-left',
                  activeRoomId === m.chatRoomId && 'bg-gray-100'
                )}
              >
                <img
                  src={m.user?.avatar || '/avatar-placeholder.png'}
                  alt={m.user?.name || 'user'}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {m.user?.name || '用户'}
                    </span>
                    {m.lastMessage?.createdAt && (
                      <span className="ml-2 text-[11px] text-gray-400 shrink-0">
                        {new Date(m.lastMessage.createdAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {m.lastMessage?.content || '点击开始聊天'}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* 右侧：聊天窗口 */}
      <main className="flex-1 flex flex-col">
        {/* 顶部标题栏 */}
        <div className="h-14 px-4 border-b bg-white flex items-center gap-3">
          {activeMatchUser ? (
            <>
              <img
                src={activeMatchUser.avatar || '/avatar-placeholder.png'}
                alt={activeMatchUser.name || 'user'}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">{activeMatchUser.name}</span>
                <span className="text-[11px] text-gray-500">正在对话</span>
              </div>
            </>
          ) : (
            <span className="text-sm text-gray-500">选择一个匹配开始聊天</span>
          )}
        </div>

        {/* 消息列表 */}
        <div className="flex-1 bg-gradient-to-b from-gray-50 to-white overflow-y-auto p-4">
          <div className="max-w-3xl mx-auto">
            {loadingMessages ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                正在加载消息...
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                暂无消息，开始你的第一条对话吧～
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((msg) => {
                  const isMe =
                    (msg as any).senderId === 'me' ||
                    (msg as any).senderId === (window as any)?.currentUserId;
                  return (
                    <div key={msg._id} className={clsx('flex items-end gap-2', isMe ? 'justify-end' : 'justify-start')}>
                      {!isMe && (
                        <img
                          src={activeMatchUser?.avatar || '/avatar-placeholder.png'}
                          alt="u"
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      )}
                      <div
                        className={clsx(
                          'px-3 py-2 rounded-2xl max-w-[70%] shadow-sm',
                          isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border rounded-bl-sm'
                        )}
                      >
                        <div className="whitespace-pre-wrap break-words text-sm">{msg.content}</div>
                        <div className={clsx('mt-1 text-[10px]', isMe ? 'text-blue-100' : 'text-gray-400')}>
                          {new Date(msg.createdAt).toLocaleString()}
                        </div>
                      </div>
                      {isMe && (
                        <img
                          src={(window as any)?.currentUserAvatar || '/avatar-placeholder.png'}
                          alt="me"
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      )}
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </div>

        {/* 输入区 */}
        <div className="border-t bg-white">
          <div className="max-w-3xl mx-auto p-3 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              className="flex-1 h-11 rounded-xl border px-4 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder={activeRoomId ? '输入消息，按 Enter 发送' : '请选择左侧联系人开始聊天'}
              disabled={!activeRoomId}
            />
            <button
              className={clsx(
                'h-11 px-5 rounded-xl text-white transition',
                activeRoomId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
              )}
              onClick={handleSend}
              disabled={!activeRoomId || sending}
            >
              {sending ? '发送中...' : '发送'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}