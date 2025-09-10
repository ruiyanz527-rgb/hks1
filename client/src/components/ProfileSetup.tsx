import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { apiMethods } from '../utils/api';

interface ProfileSetupProps {
  onComplete: () => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    department: '',
    academicLevel: '',
    researchInterests: '',
    skills: '',
    bio: '',
    contactInfo: ''
  });
  
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // 预定义的研究兴趣和技能选项
  const interestOptions = [
    '人工智能', '机器学习', '深度学习', '计算机视觉', '自然语言处理',
    '数据科学', '区块链', '网络安全', '软件工程', '移动开发',
    '前端开发', '后端开发', '全栈开发', '云计算', '物联网',
    '生物信息学', '量子计算', '机器人学', '虚拟现实', '增强现实'
  ];

  const skillOptions = [
    'Python', 'JavaScript', 'Java', 'C++', 'React', 'Node.js',
    'TensorFlow', 'PyTorch', 'Docker', 'Kubernetes', 'AWS',
    'Git', 'SQL', 'MongoDB', 'Redis', 'Linux', 'Matlab',
    'R', 'Scala', 'Go', 'Rust', 'Swift', 'Kotlin', 'Flutter'
  ];

  const departmentOptions = [
    '计算机科学系', '电子工程系', '数学系', '物理系', '化学系',
    '生物医学工程系', '机械工程系', '土木工程系', '商学院',
    '法学院', '文学院', '社会科学院', '建筑学院', '创意媒体学院'
  ];

  const academicLevelOptions = [
    '本科生', '硕士研究生', '博士研究生', '博士后', '助理教授',
    '副教授', '教授', '研究员', '访问学者'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const profileData = {
        ...formData,
        age: parseInt(formData.age),
        researchInterests: selectedInterests.join(', '),
        skills: selectedSkills.join(', ')
      };

      await apiMethods.updateProfile(profileData);
      onComplete();
    } catch (error) {
      console.error('更新个人资料失败:', error);
      alert('更新个人资料失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.name && formData.age && formData.department && formData.academicLevel;
      case 2:
        return selectedInterests.length > 0 && selectedSkills.length > 0;
      case 3:
        return formData.bio && formData.contactInfo;
      default:
        return false;
    }
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">基本信息</h2>
        <p className="text-gray-600">请填写您的基本信息</p>
      </div>

      <div className="space-y-4">
        <Input
          type="text"
          placeholder="姓名"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
        />

        <Input
          type="number"
          placeholder="年龄"
          value={formData.age}
          onChange={(e) => handleInputChange('age', e.target.value)}
        />

        <select
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={formData.department}
          onChange={(e) => handleInputChange('department', e.target.value)}
        >
          <option value="">选择院系</option>
          {departmentOptions.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        <select
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={formData.academicLevel}
          onChange={(e) => handleInputChange('academicLevel', e.target.value)}
        >
          <option value="">选择学术级别</option>
          {academicLevelOptions.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">研究兴趣与技能</h2>
        <p className="text-gray-600">选择您的研究兴趣和技能标签</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">研究兴趣 (至少选择1个)</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {interestOptions.map(interest => (
            <Badge
              key={interest}
              variant={selectedInterests.includes(interest) ? 'primary' : 'secondary'}
              className="cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => toggleInterest(interest)}
            >
              {interest}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">技能标签 (至少选择1个)</h3>
        <div className="flex flex-wrap gap-2">
          {skillOptions.map(skill => (
            <Badge
              key={skill}
              variant={selectedSkills.includes(skill) ? 'primary' : 'secondary'}
              className="cursor-pointer hover:bg-green-100 transition-colors"
              onClick={() => toggleSkill(skill)}
            >
              {skill}
            </Badge>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">个人简介</h2>
        <p className="text-gray-600">完善您的个人信息</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            个人简介
          </label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            placeholder="介绍一下您的研究背景、兴趣爱好等..."
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            联系方式
          </label>
          <Input
            type="text"
            placeholder="微信号、邮箱或其他联系方式"
            value={formData.contactInfo}
            onChange={(e) => handleInputChange('contactInfo', e.target.value)}
          />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        {/* 进度条 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              步骤 {currentStep} / 3
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round((currentStep / 3) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* 步骤内容 */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        {/* 导航按钮 */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
          >
            上一步
          </Button>

          {currentStep < 3 ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!isStepValid(currentStep)}
            >
              下一步
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid(currentStep) || loading}
            >
              {loading ? '保存中...' : '完成设置'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;