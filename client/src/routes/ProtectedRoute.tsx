import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// 依据项目需求自定义“资料完整”的标准
function isProfileComplete(user: any): boolean {
  if (!user) return false;
  const requiredNonEmpty = [
    user.name,
    user.department,
    user.academicLevel,
    user.bio,
    user.contactInfo,
  ];
  const hasBasics = requiredNonEmpty.every(v => typeof v === 'string' ? v.trim().length > 0 : !!v);

  // 研究兴趣/技能可任一非空即可
  const interests = Array.isArray(user.researchInterests)
    ? user.researchInterests.map((ri: any) => typeof ri === 'object' ? (ri.field ?? '') : ri).filter(Boolean)
    : [];
  const skills = Array.isArray(user.skills)
    ? user.skills.map((s: any) => typeof s === 'object' ? (s.name ?? '') : s).filter(Boolean)
    : [];
  const hasAtLeastOneTag = interests.length > 0 || skills.length > 0;

  return hasBasics && hasAtLeastOneTag;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // 对/profile自身不做强制重定向（允许用户进入完善资料）
  const onProfilePage = location.pathname === '/profile';

  const profileComplete = useMemo(() => isProfileComplete(user), [user]);

  // 若已登录但资料不完整，且不在/profile，强制跳转到/profile
  if (user && !profileComplete && !onProfilePage) {
    return <Navigate to="/profile" replace state={{ from: location }} />;
  }

  // 正常放行
  return <>{children}</>;
};

export default ProtectedRoute;