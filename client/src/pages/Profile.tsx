import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api, uploadAPI } from '../utils/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface UserProfile {
  name: string;
  email: string;
  age: number | string;
  department: string;
  bio: string;
  academicLevel: string;
  institution: string;
  researchInterests: string[];
  skills: string[];
  location: string;
  contactInfo: string;
  avatar?: string;
}

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    age: '',
    department: '',
    bio: '',
    academicLevel: '',
    institution: '',
    researchInterests: [],
    skills: [],
    location: '',
    contactInfo: '',
    avatar: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newInterest, setNewInterest] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        age: (user as any).age || '',
        department: (user as any).department || '',
        bio: (user as any).bio || '',
        academicLevel: (user as any).academicLevel || '',
        institution: (user as any).institution || '',
        // 研究兴趣：兼容对象数组或字符串数组
        researchInterests: Array.isArray((user as any).researchInterests)
          ? (user as any).researchInterests.map((ri: any) => (typeof ri === 'object' ? ri.field : ri))
          : [],
        // 技能：兼容对象数组或字符串数组
        skills: Array.isArray((user as any).skills)
          ? (user as any).skills.map((s: any) => (typeof s === 'object' ? s.name : s))
          : [],
        location: (user as any).location || '',
        contactInfo: (user as any).contactInfo || '',
        avatar: (user as any).avatar || '',
      });
    }
  }, [user]);

  // 选择头像文件
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // 上传头像
  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    try {
      const response = await uploadAPI.uploadAvatar(avatarFile);
      console.log('头像上传响应:', response.data);

      const avatarUrl = (response.data as any).avatar || response.data?.data?.avatar;
      const fullAvatarUrl = avatarUrl?.startsWith('http')
        ? avatarUrl
        : avatarUrl
        ? `http://localhost:5000${avatarUrl}`
        : '';

      console.log('完整头像URL:', fullAvatarUrl);

      const updatedUser = { ...(user as any), avatar: fullAvatarUrl };
      updateUser(updatedUser);

      setProfile((prev) => ({ ...prev, avatar: fullAvatarUrl }));
      setAvatarFile(null);
      setAvatarPreview('');
      alert('头像上传成功！');
    } catch (error) {
      console.error('头像上传失败:', error);
      alert('头像上传失败，请重试');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCancelAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 保存资料
  const handleSave = async () => {
    setLoading(true);
    try {
      const profileData = {
        name: profile.name,
        age: parseInt(profile.age.toString()) || undefined,
        department: profile.department,
        academicLevel: profile.academicLevel,
        bio: profile.bio,
        contactInfo: profile.contactInfo,
        researchInterests: profile.researchInterests.map((interest) => ({
          field: interest,
          keywords: [],
          level: 'intermediate',
        })),
        skills: profile.skills.map((skill) => ({
          name: skill,
          level: 'intermediate',
          category: 'other',
        })),
      };

      console.log('发送的个人资料:', profileData);
      const response = await api.put('/users/profile', profileData);
      console.log('后端响应:', response.data);

      const updatedUserData = (response.data as any).data || (response.data as any).user || {};
      updateUser(updatedUserData);

      setProfile((prev) => ({
        ...prev,
        name: updatedUserData.name || prev.name,
        age: updatedUserData.age || prev.age,
        department: updatedUserData.department || prev.department,
        academicLevel: updatedUserData.academicLevel || prev.academicLevel,
        bio: updatedUserData.bio || prev.bio,
        contactInfo: updatedUserData.contactInfo || prev.contactInfo,
        researchInterests: Array.isArray(updatedUserData.researchInterests)
          ? updatedUserData.researchInterests.map((ri: any) => ri.field || ri)
          : prev.researchInterests,
        skills: Array.isArray(updatedUserData.skills)
          ? updatedUserData.skills.map((s: any) => s.name || s)
          : prev.skills,
      }));

      setIsEditing(false);
      alert('个人资料更新成功！');

      // 再次获取最新用户，确保全局一致
      try {
        const refreshed = await api.get('/users/profile');
        const freshUser = (refreshed.data as any).user || refreshed.data;
        if (freshUser) updateUser(freshUser as any);
      } catch (e) {
        console.warn('刷新用户资料失败，但不影响已成功保存', e);
      }
    } catch (error: any) {
      console.error('个人资料更新失败:', error);
      console.error('错误详情:', error?.response?.data);
      alert(`更新失败: ${error?.response?.data?.message || error?.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 兴趣/技能增删
  const addInterest = () => {
    const v = newInterest.trim();
    if (v && !profile.researchInterests.includes(v)) {
      setProfile((prev) => ({ ...prev, researchInterests: [...prev.researchInterests, v] }));
      setNewInterest('');
    }
  };
  const removeInterest = (interest: string) => {
    setProfile((prev) => ({
      ...prev,
      researchInterests: prev.researchInterests.filter((i) => i !== interest),
    }));
  };
  const addSkill = () => {
    const v = newSkill.trim();
    if (v && !profile.skills.includes(v)) {
      setProfile((prev) => ({ ...prev, skills: [...prev.skills, v] }));
      setNewSkill('');
    }
  };
  const removeSkill = (skill: string) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((i) => i !== skill),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">个人资料</h1>
          <div className="space-x-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>编辑</Button>
            ) : (
              <>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? '保存中...' : '保存'}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={loading}>
                  取消
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 基本信息 */}
          <Card className="md:col-span-2">
            <CardHeader>
              <h2 className="text-xl font-semibold">基本信息</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="姓名"
                  value={profile.name}
                  onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={!isEditing}
                />
                <Input label="邮箱" value={profile.email} disabled />
                <Input
                  label="年龄"
                  value={profile.age}
                  onChange={(e) => setProfile((prev) => ({ ...prev, age: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="请输入年龄"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">院系</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50"
                    value={profile.department}
                    onChange={(e) => setProfile((prev) => ({ ...prev, department: e.target.value }))}
                    disabled={!isEditing}
                  >
                    <option value="">请选择院系</option>
                    <option value="计算机科学系">计算机科学系</option>
                    <option value="电子工程系">电子工程系</option>
                    <option value="数学系">数学系</option>
                    <option value="物理系">物理系</option>
                    <option value="医学系">医学系</option>
                    <option value="生物化学工程系">生物化学工程系</option>
                    <option value="机械工程系">机械工程系</option>
                    <option value="土木工程系">土木工程系</option>
                    <option value="商学院">商学院</option>
                    <option value="法学院">法学院</option>
                    <option value="文学院">文学院</option>
                    <option value="社会科学学院">社会科学学院</option>
                    <option value="建筑学院">建筑学院</option>
                    <option value="创意媒体学院">创意媒体学院</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">个人简介</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50"
                  rows={4}
                  value={profile.bio}
                  onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="介绍一下你的研究背景与兴趣..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">学术级别</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50"
                    value={profile.academicLevel}
                    onChange={(e) => setProfile((prev) => ({ ...prev, academicLevel: e.target.value }))}
                    disabled={!isEditing}
                  >
                    <option value="">请选择学术级别</option>
                    <option value="本科生">本科生</option>
                    <option value="硕士研究生">硕士研究生</option>
                    <option value="博士研究生">博士研究生</option>
                    <option value="助理教授">助理教授</option>
                    <option value="副教授">副教授</option>
                    <option value="教授">教授</option>
                    <option value="研究员">研究员</option>
                    <option value="访问学者">访问学者</option>
                  </select>
                </div>
                <Input
                  label="所在机构"
                  value={profile.institution}
                  onChange={(e) => setProfile((prev) => ({ ...prev, institution: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>

              <Input
                label="所在地区"
                value={profile.location}
                onChange={(e) => setProfile((prev) => ({ ...prev, location: e.target.value }))}
                disabled={!isEditing}
              />
              <Input
                label="联系方式"
                value={profile.contactInfo}
                onChange={(e) => setProfile((prev) => ({ ...prev, contactInfo: e.target.value }))}
                disabled={!isEditing}
                placeholder="微信/邮箱或其它联系方式"
              />
            </CardContent>
          </Card>

          {/* 头像与上传 */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">头像</h2>
            </CardHeader>
            <CardContent className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="头像预览" className="w-full h-full object-cover" />
                ) : profile.avatar ? (
                  <img src={profile.avatar} alt="用户头像" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-4xl font-bold">
                    {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>

              {isEditing && (
                <div className="space-y-2">
                  {!avatarFile ? (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                        选择头像
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Button size="sm" onClick={handleAvatarUpload} disabled={uploadingAvatar}>
                        {uploadingAvatar ? '上传中...' : '确认上传'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCancelAvatar} disabled={uploadingAvatar}>
                        取消
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 研究兴趣 */}
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-xl font-semibold">研究兴趣</h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.researchInterests.map((interest, index) => (
                <Badge key={index} variant="primary" className="flex items-center gap-2">
                  {interest}
                  {isEditing && (
                    <button onClick={() => removeInterest(interest)} className="ml-1 text-xs hover:text-red-600">
                      ×
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {isEditing && (
              <div className="flex gap-2">
                <Input
                  placeholder="添加研究兴趣"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                />
                <Button onClick={addInterest} size="sm">
                  添加
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 技能专长 */}
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-xl font-semibold">技能专长</h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-2">
                  {skill}
                  {isEditing && (
                    <button onClick={() => removeSkill(skill)} className="ml-1 text-xs hover:text-red-600">
                      ×
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {isEditing && (
              <div className="flex gap-2">
                <Input
                  placeholder="添加技能"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                />
                <Button onClick={addSkill} size="sm">
                  添加
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};