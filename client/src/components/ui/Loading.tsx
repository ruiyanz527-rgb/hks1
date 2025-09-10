import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  text, 
  fullScreen = false,
  className 
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const LoadingSpinner = () => (
    <motion.div
      className={clsx(
        'border-2 border-gray-200 border-t-primary-600 rounded-full',
        sizes[size]
      )}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );

  const content = (
    <div className={clsx(
      'flex flex-col items-center justify-center space-y-3',
      fullScreen && 'min-h-screen',
      className
    )}>
      <LoadingSpinner />
      {text && (
        <p className={clsx('text-gray-600', textSizes[size])}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

// 页面加载组件
export const PageLoading: React.FC<{ text?: string }> = ({ text = '加载中...' }) => (
  <Loading fullScreen text={text} size="lg" />
);

// 按钮加载组件
export const ButtonLoading: React.FC = () => (
  <Loading size="sm" className="mr-2" />
);

// 内容加载组件
export const ContentLoading: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex items-center justify-center py-12">
    <Loading text={text} />
  </div>
);

export default Loading;