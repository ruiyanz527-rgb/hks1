import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const ProfileSetup: React.FC = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    age: '',
    department: '',
    academicLevel: '',
    bio: '',
    researchInterests: '',
    skills: ''
  });

  const handleChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 组装为后端期望的对象数组结构
      const payload = {
        name: form.name.trim(),
        age: form.age ? parseInt(form.age, 10) : undefined,
        department: form.department,
        academicLevel: form.academicLevel,
        bio: form.bio,
        // 对象数组
        researchInterests: form.researchInterests
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .map(field => ({ field, keywords: [field], level: 'intermediate' })),
        skills: form.skills
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .map(name => ({ name, level: 'intermediate', category: 'other' }))
      };

      const resp = await api.put('/users/profile', payload);
      if (resp.status >= 200 && resp.status < 300) {
        // 保存成功后，拉取最新资料并更新全局用户
        try {
          const profileResp = await api.get('/users/profile');
          const raw = profileResp?.data;
          // 兼容多种返回结构
          const freshUser =
            raw?.user ??
            raw?.data ??
            (typeof raw === 'object' && raw?.email ? raw : null);
          if (freshUser) {
            updateUser(freshUser);
          }
        } catch (_) {}
        navigate('/profile');
      }
    } catch (err: any) {
      alert(`保存失败：${err?.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">完善资料</h1>
        <p className="text-gray-600 mb-6">请填写以下关键信息，后续可在“个人资料”页面继续补充</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input label="姓名" value={form.name} onChange={handleChange('name')} required placeholder="例如：Zhang San" />
          <Input label="年龄" type="number" value={form.age} onChange={handleChange('age')} required placeholder="18-100" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">院系</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={form.department}
                onChange={handleChange('department')}
                required
              >
                <option value="">选择院系</option>
                <option value="计算机科学系">计算机科学系</option>
                <option value="电子工程系">电子工程系</option>
                <option value="数学系">数学系</option>
                <option value="物理系">物理系</option>
                <option value="化学系">化学系</option>
                <option value="生物医学工程系">生物医学工程系</option>
                <option value="机械工程系">机械工程系</option>
                <option value="土木工程系">土木工程系</option>
                <option value="商学院">商学院</option>
                <option value="法学院">法学院</option>
                <option value="文学院">文学院</option>
                <option value="社会科学院">社会科学院</option>
                <option value="建筑学院">建筑学院</option>
                <option value="创意媒体学院">创意媒体学院</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">学术级别</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={form.academicLevel}
                onChange={handleChange('academicLevel')}
                required
              >
                <option value="">选择级别</option>
                <option value="本科生">本科生</option>
                <option value="硕士研究生">硕士研究生</option>
                <option value="博士研究生">博士研究生</option>
                <option value="博士后">博士后</option>
                <option value="助理教授">助理教授</option>
                <option value="副教授">副教授</option>
                <option value="教授">教授</option>
                <option value="研究员">研究员</option>
                <option value="访问学者">访问学者</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">个人简介</label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={form.bio}
              onChange={handleChange('bio')}
              required
              placeholder="简要介绍你的研究背景与兴趣点"
            />
          </div>

          <Input
            label="研究兴趣（逗号分隔）"
            value={form.researchInterests}
            onChange={handleChange('researchInterests')}
            required
            placeholder="如：机器学习, 深度学习, NLP"
          />

          <Input
            label="技能（逗号分隔）"
            value={form.skills}
            onChange={handleChange('skills')}
            required
            placeholder="如：Python, PyTorch, React"
          />

          <div className="pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存并前往个人资料页'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;