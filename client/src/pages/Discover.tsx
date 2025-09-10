import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchAPI, chatAPI } from '../utils/api';
import clsx from 'clsx';
import MatchModal from '../components/MatchModal';

type RecUser = {
  id?: string;
  _id?: string;
  name?: string;
  avatar?: string;
  department?: string;
  academicLevel?: string;
  bio?: string;
  // 可选：兼容 seed 中可能存在的年龄字段
  age?: number;
};

type Recommendation = {
  id: string;
  user: RecUser;
};

function seededPercent(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const r = Math.abs(h % 36) + 62;
  return r;
}

function normalizeAvatar(src?: string) {
  if (!src || typeof src !== 'string') return '/avatar-placeholder.png';
  const s = src.trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/')) return s;
  if (s.startsWith('uploads/')) return `/${s}`;
  return `/uploads/${s}`;
}

function Discover() {
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [matchedCount, setMatchedCount] = useState(0);
  const [passedCount, setPassedCount] = useState(0);

  const [matchModal, setMatchModal] = useState<{
    isOpen: boolean;
    peer?: RecUser;
    chatRoomId?: string;
  }>({ isOpen: false });

  const topCard = recommendations[index];
  const hasMore = index < recommendations.length;

  const fetchRecs = async () => {
    const setBusy = refreshing ? setRefreshing : setLoading;
    setBusy(true);
    try {
      const resp = await (matchAPI as any).getRecommendations?.({ count: 20 });
      const list = (resp?.data?.recommendations || resp?.data || resp || []) as any[];
      const normalized: Recommendation[] = list.map((it: any, idx: number) => {
        const user = it.user || it;
        const id = it.id || it._id || user?.id || user?._id || String(idx);
        return {
          id,
          user: {
            id: user?.id || user?._id,
            _id: user?._id || user?.id,
            name: user?.name || '未命名',
            avatar: user?.avatar || '/avatar-placeholder.png',
            department: user?.department,
            academicLevel: user?.academicLevel,
            bio: user?.bio,
            age: user?.age,
          },
        };
      });
      setRecommendations(normalized);
      setIndex(0);
    } catch (e) {
      console.error('fetch recommendations error:', e);
      setRecommendations([]);
      setIndex(0);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    fetchRecs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLike = async () => {
    if (!topCard) return;
    try {
      const targetUserId = topCard.user.id || (topCard.user._id as string);
      const resp = await (matchAPI as any).swipe?.({ targetUserId, action: 'like' });
      const result = resp?.data || resp || {};
      if (result?.isMatch) {
        setMatchedCount((v) => v + 1);
        setMatchModal({
          isOpen: true,
          peer: topCard.user,
          chatRoomId: result?.roomId || result?.chatRoomId,
        });
      } else {
        setIndex((i) => i + 1);
      }
    } catch (e) {
      console.error('like error:', e);
      setIndex((i) => i + 1);
    }
  };

  const handlePass = async () => {
    if (!topCard) return;
    try {
      const targetUserId = topCard.user.id || (topCard.user._id as string);
      await (matchAPI as any).swipe?.({ targetUserId, action: 'pass' });
    } catch {}
    setPassedCount((v) => v + 1);
    setIndex((i) => i + 1);
  };

  const handleMessage = async () => {
    if (!topCard) return;
    try {
      const targetUserId = topCard.user.id || (topCard.user._id as string);
      const resp = await (chatAPI as any).start?.(targetUserId);
      const roomId = (resp?.data?.roomId || resp?.roomId) as string | undefined;
      if (roomId) {
        (window as any).__lastChatPeer = {
          roomId,
          user: {
            id: topCard.user.id || topCard.user._id,
            _id: topCard.user._id || topCard.user.id,
            name: topCard.user.name,
            avatar: topCard.user.avatar,
          },
        };
        navigate(`/chat/${roomId}`);
      }
    } catch (e) {
      console.error('start chat error:', e);
    }
  };

  const randomPercent = useMemo(() => {
    if (!topCard) return 0;
    const seed = topCard.user.id || topCard.user._id || topCard.id;
    return seededPercent(String(seed));
  }, [topCard]);

  const onStartChatFromModal = () => {
    if (!matchModal.chatRoomId || !matchModal.peer) {
      setMatchModal({ isOpen: false });
      return;
    }
    (window as any).__lastChatPeer = {
      roomId: matchModal.chatRoomId,
      user: {
        id: matchModal.peer.id || matchModal.peer._id,
        _id: matchModal.peer._id || matchModal.peer.id,
        name: matchModal.peer.name,
        avatar: matchModal.peer.avatar,
      },
    };
    setMatchModal({ isOpen: false });
    navigate(`/chat/${matchModal.chatRoomId}`);
  };

  // 轻量拖拽（简洁手势，无旋转）
  const [drag, setDrag] = useState<{ dx: number; dy: number; active: boolean }>({ dx: 0, dy: 0, active: false });
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const threshold = 120;

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center"
      style={{
        backgroundImage: "url('/bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="w-full max-w-3xl mx-auto mt-8 px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white drop-shadow">发现</h1>
          <button
            onClick={async () => {
              setRefreshing(true);
              await fetchRecs();
              setRefreshing(false);
            }}
            className={clsx(
              'h-9 px-3 rounded-lg text-sm',
              'bg-white/80 hover:bg-white text-gray-800 shadow'
            )}
            disabled={refreshing}
            title="刷新推荐"
          >
            {refreshing ? '刷新中…' : '刷新'}
          </button>
        </div>

        <div className="relative mt-6 min-h-[420px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white/90 text-sm">加载推荐中…</div>
            </div>
          )}

          {hasMore && topCard ? (
            <div className="relative flex items-center justify-center">
              <div
                key={topCard.id}
                onPointerDown={(e) => {
                  const p = e as unknown as PointerEvent;
                  startRef.current = { x: p.clientX, y: p.clientY };
                  setDrag({ dx: 0, dy: 0, active: true });
                }}
                onPointerMove={(e) => {
                  if (!drag.active || !startRef.current) return;
                  const p = e as unknown as PointerEvent;
                  const dx = p.clientX - startRef.current.x;
                  const dy = p.clientY - startRef.current.y;
                  setDrag((d) => ({ ...d, dx, dy }));
                }}
                onPointerUp={() => {
                  if (!startRef.current) return;
                  const dx = drag.dx;
                  const abs = Math.abs(dx);
                  startRef.current = null;
                  if (abs >= threshold) {
                    if (dx > 0) handleLike(); else handlePass();
                  }
                  setDrag({ dx: 0, dy: 0, active: false });
                }}
                onPointerCancel={() => {
                  startRef.current = null;
                  setDrag({ dx: 0, dy: 0, active: false });
                }}
                style={{
                  touchAction: 'none',
                  transform: `translate(${drag.dx}px, ${drag.dy}px)`,
                  transition: drag.active ? 'none' : 'transform 180ms ease',
                  width: '100%',
                  maxWidth: '340px',
                }}
                className="select-none relative"
              >
                <div className="rounded-xl overflow-hidden shadow-xl bg-[#111] text-white">
                  <div className="relative w-full" style={{ paddingTop: '125%' }}>
                    <img
                      src={normalizeAvatar(topCard.user.avatar)}
                      alt={topCard.user.name || 'user'}
                      className="absolute inset-0 w-full h-full object-cover bg-[#222]"
                      onError={(e) => {
                        const t = e.currentTarget as HTMLImageElement;
                        try {
                          const u = new URL(t.src);
                          const pathname = u.pathname || '';
                          if (!pathname.includes('/avatar-placeholder.png')) {
                            if (!pathname.startsWith('/uploads/')) {
                              const fname = pathname.split('/').pop() || '';
                              if (fname && fname !== 'avatar-placeholder.png') {
                                t.src = `/uploads/${fname}`;
                                return;
                              }
                            }
                          }
                        } catch {}
                        if (t.src.indexOf('/avatar-placeholder.png') === -1) {
                          t.src = '/avatar-placeholder.png';
                        }
                      }}
                    />
                  </div>
                  <div className="p-4 pb-16">
                    <div className="flex items-center justify-between">
                      <div className="text-xl font-semibold truncate">
                        {topCard.user.name || '未命名'}
                        {typeof topCard.user.age === 'number' ? (
                          <span className="ml-2 text-white/70 text-base">{topCard.user.age}</span>
                        ) : null}
                      </div>
                      <span className="text-xs text-rose-300 bg-rose-900/40 px-2 py-0.5 rounded-full">
                        匹配度 {randomPercent}%
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-white/60 space-x-2">
                      {topCard.user.department ? <span>{topCard.user.department}</span> : null}
                      {topCard.user.academicLevel ? <span>· {topCard.user.academicLevel}</span> : null}
                    </div>

                    {topCard.user.bio ? (
                      <div className="mt-3 text-sm text-white/80 whitespace-pre-wrap">
                        {topCard.user.bio}
                      </div>
                    ) : null}

                    {/* 可选扩展字段：兴趣/标签、邮箱/联系方式（如不需要可移除） */}
                    {(topCard.user as any)?.interests ? (
                      <div className="mt-3">
                        <div className="text-xs text-white/50 mb-1">兴趣</div>
                        <div className="flex flex-wrap gap-2">
                          {(((topCard.user as any).interests) as string[])
                            .filter(Boolean)
                            .slice(0, 6)
                            .map((tag: string, i: number) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/80"
                              >
                                {tag}
                              </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {(topCard.user as any)?.major || (topCard.user as any)?.year ? (
                      <div className="mt-3 text-xs text-white/60 space-x-2">
                        {(topCard.user as any).major ? <span>专业：{(topCard.user as any).major}</span> : null}
                        {(topCard.user as any).year ? <span>· 年级：{(topCard.user as any).year}</span> : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* 底部操作条（简洁风格） */}
                <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 -bottom-5 flex items-center gap-4">
                  <button
                    onClick={handlePass}
                    className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/70 text-white shadow flex items-center justify-center text-base"
                    title="跳过"
                  >
                    ✕
                  </button>
                  <button
                    onClick={handleLike}
                    className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow flex items-center justify-center text-base"
                    title="喜欢"
                  >
                    ❤
                  </button>
                  <button
                    onClick={handleMessage}
                    className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow flex items-center justify-center text-base"
                    title="发消息"
                  >
                    ✉
                  </button>
                </div>
              </div>
            </div>
          ) : !loading ? (
            <div className="h-[420px] flex items-center justify-center">
              <div className="text-white/90 text-sm">没有更多推荐了，稍后再来看看～</div>
            </div>
          ) : null}
          
          {/* 左下角计数面板 */}
          <div className="fixed bottom-4 left-4 z-50">
            <div className="bg-black/60 text-white px-3 py-2 rounded-lg text-xs leading-5 shadow">
              <div>
                匹配成功：<span className="font-semibold text-green-400">{matchedCount}</span>
              </div>
              <div>
                未匹配（跳过）：<span className="font-semibold text-red-400">{passedCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MatchModal
        isOpen={matchModal.isOpen}
        peer={matchModal.peer}
        onStartChat={onStartChatFromModal}
        onClose={() => setMatchModal({ isOpen: false })}
      />
    </div>
  );
}

export default Discover;