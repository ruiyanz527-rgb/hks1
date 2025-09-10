import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Heart, X, MapPin, GraduationCap, Briefcase } from 'lucide-react';
import { Recommendation } from '../types';
import Badge from './ui/Badge';
import { Card, CardContent } from './ui/Card';

// 基于字符串的简易伪随机，保证同一id在本会话内稳定
function seededRandomPercent(seedStr: string, min = 62, max = 97) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) | 0;
  }
  const rnd = Math.abs(Math.sin(hash)) % 1; // 归一化到 [0,1)
  const val = Math.floor(min + rnd * (max - min + 1));
  return Math.max(min, Math.min(max, val));
}

interface SwipeCardProps {
  recommendation: Recommendation;
  onSwipe: (userId: string, action: 'like' | 'pass') => void;
  isTop?: boolean;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ 
  recommendation, 
  onSwipe, 
  isTop = false 
}) => {
  const [exitX, setExitX] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  
  const cardRef = useRef<HTMLDivElement>(null);

  const { user, matchScore, reasons } = recommendation;
  // 使用基于用户id的随机匹配度（会话内稳定）
  const seed = String(user.id || (user as any)._id || user.email || user.name || 'seed');
  const randomPercent = seededRandomPercent(seed);

  // 处理拖拽结束
  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      // 向右滑动 - 喜欢
      setExitX(200);
      onSwipe(user.id, 'like');
    } else if (info.offset.x < -threshold) {
      // 向左滑动 - 跳过
      setExitX(-200);
      onSwipe(user.id, 'pass');
    }
  };

  // 手动触发滑动
  const handleLike = () => {
    setExitX(200);
    onSwipe(user.id, 'like');
  };

  const handlePass = () => {
    setExitX(-200);
    onSwipe(user.id, 'pass');
  };

  return (
    <motion.div
      ref={cardRef}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, opacity }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={exitX !== 0 ? { x: exitX } : {}}
      transition={{ duration: 0.3 }}
      whileDrag={{ scale: 1.05 }}
    >
      <Card className="h-full overflow-hidden shadow-lg">
        {/* 用户头像和基本信息 */}
        <div className="relative h-64 bg-gradient-to-br from-primary-400 to-primary-600">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}
          
          {/* 匹配分数 */}
          <div className="absolute top-4 right-4">
            <Badge variant="success" size="lg">
              {randomPercent}% 匹配
            </Badge>
          </div>

          {/* 滑动提示 */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: x.get() > 50 ? 1 : x.get() < -50 ? 1 : 0 
            }}
          >
            {x.get() > 50 && (
              <div className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold text-xl transform rotate-12">
                LIKE
              </div>
            )}
            {x.get() < -50 && (
              <div className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold text-xl transform -rotate-12">
                PASS
              </div>
            )}
          </motion.div>
        </div>

        <CardContent className="p-6 space-y-4">
          {/* 姓名和职位 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
            {user.profile?.title && (
              <p className="text-gray-600 flex items-center mt-1">
                <Briefcase className="w-4 h-4 mr-2" />
                {user.profile.title}
              </p>
            )}
            {user.profile?.institution && (
              <p className="text-gray-600 flex items-center mt-1">
                <GraduationCap className="w-4 h-4 mr-2" />
                {user.profile.institution}
              </p>
            )}
            {user.profile?.location?.city && (
              <p className="text-gray-600 flex items-center mt-1">
                <MapPin className="w-4 h-4 mr-2" />
                {user.profile.location.city}
              </p>
            )}
          </div>

          {/* 个人简介 */}
          {user.profile?.bio && (
            <div>
              <p className="text-gray-700 text-sm leading-relaxed">
                {user.profile.bio}
              </p>
            </div>
          )}

          {/* 研究兴趣 */}
          {user.researchInterests && user.researchInterests.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">研究兴趣</h3>
              <div className="flex flex-wrap gap-2">
                {user.researchInterests.slice(0, 3).map((interest, index) => (
                  <Badge key={index} variant="primary">
                    {interest.field}
                  </Badge>
                ))}
                {user.researchInterests.length > 3 && (
                  <Badge variant="secondary">
                    +{user.researchInterests.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* 技能 */}
          {user.skills && user.skills.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">技能</h3>
              <div className="flex flex-wrap gap-2">
                {user.skills.slice(0, 4).map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill.name}
                  </Badge>
                ))}
                {user.skills.length > 4 && (
                  <Badge variant="secondary">
                    +{user.skills.length - 4}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* 匹配原因 */}
          {reasons && reasons.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">匹配原因</h3>
              <ul className="space-y-1">
                {reasons.slice(0, 2).map((reason, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>

        {/* 操作按钮 */}
        {isTop && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
            <motion.button
              className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-red-500 hover:bg-red-50"
              onClick={handlePass}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-6 h-6" />
            </motion.button>
            <motion.button
              className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-green-500 hover:bg-green-50"
              onClick={handleLike}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Heart className="w-6 h-6" />
            </motion.button>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default SwipeCard;