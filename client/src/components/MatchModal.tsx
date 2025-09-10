import React from 'react';
import clsx from 'clsx';

type BasicUser = {
  id?: string;
  _id?: string;
  name?: string;
  avatar?: string;
  [key: string]: any;
};

type MatchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: () => void;
  // 兼容老用法
  matchedUser?: BasicUser | null;
  // 兼容 Discover 传参
  peer?: BasicUser | null;
  // 可选匹配分数
  matchScore?: number;
};

const MatchModal: React.FC<MatchModalProps> = ({
  isOpen,
  onClose,
  onStartChat,
  matchedUser,
  peer,
  matchScore = 0,
}) => {
  if (!isOpen) return null;

  // 统一对方信息来源（优先 peer）
  const user = peer ?? matchedUser ?? null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* 弹窗 */}
      <div className="relative z-[1001] w-[92%] max-w-md rounded-2xl bg-white shadow-xl border p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full border-4 border-green-400 overflow-hidden shadow mb-3">
            <img
              src={user?.avatar || '/avatar-placeholder.png'}
              alt={user?.name || 'matched'}
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">匹配成功！</h3>
          <p className="mt-1 text-sm text-gray-600">
            你与 {user?.name || '对方'} 互相喜欢
          </p>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 text-xs px-2 py-1">
            推荐匹配度 {Math.round(matchScore)}%
          </div>

          {/* 按钮组 */}
          <div className="mt-5 flex w-full gap-3">
            <button
              type="button"
              onClick={onClose}
              className={clsx(
                'flex-1 h-10 rounded-lg border border-gray-300 bg-white',
                'text-gray-800 hover:bg-gray-50 transition'
              )}
            >
              稍后再聊
            </button>
            <button
              type="button"
              onClick={onStartChat}
              className={clsx(
                'flex-1 h-10 rounded-lg bg-blue-600 text-white',
                'hover:bg-blue-700 transition'
              )}
            >
              立即聊天
            </button>
          </div>
        </div>

        {/* 右上角关闭 */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default MatchModal;