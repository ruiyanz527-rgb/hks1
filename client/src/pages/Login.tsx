import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Lock, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    
    try {
      const success = await login(data.email, data.password);
      if (success) {
        navigate('/setup');
      }
    } catch (error) {
      setError('root', {
        message: '登录失败，请检查邮箱和密码'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url(/login.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* 半透明遮罩层 */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      
      {/* 内容区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4"
          >
            <Heart className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">学术匹配</h1>
          <p className="text-gray-200">连接志同道合的研究伙伴</p>
        </div>

        {/* 登录表单 */}
        <Card className="backdrop-blur-sm bg-white/90 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              欢迎回来
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 邮箱输入 */}
              <div>
                <Input
                  {...register('email', {
                    required: '请输入邮箱地址',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: '请输入有效的邮箱地址'
                    }
                  })}
                  type="email"
                  placeholder="邮箱地址"
                  icon={<Mail className="w-5 h-5" />}
                  error={errors.email?.message}
                  disabled={isSubmitting || isLoading}
                />
              </div>

              {/* 密码输入 */}
              <div>
                <Input
                  {...register('password', {
                    required: '请输入密码',
                    minLength: {
                      value: 6,
                      message: '密码至少需要6个字符'
                    }
                  })}
                  type="password"
                  placeholder="密码"
                  icon={<Lock className="w-5 h-5" />}
                  error={errors.password?.message}
                  disabled={isSubmitting || isLoading}
                />
              </div>

              {/* 错误信息 */}
              {errors.root && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-md"
                >
                  <p className="text-sm text-red-600">{errors.root.message}</p>
                </motion.div>
              )}

              {/* 登录按钮 */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || isLoading}
                loading={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? '登录中...' : '登录'}
              </Button>

              {/* 分割线 */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">或者</span>
                </div>
              </div>

              {/* 注册链接 */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  还没有账户？{' '}
                  <Link
                    to="/register"
                    className="font-medium text-purple-600 hover:text-purple-500 transition-colors"
                  >
                    立即注册
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 底部信息 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-gray-300">
            通过登录，您同意我们的{' '}
            <a href="#" className="underline hover:text-white transition-colors">
              服务条款
            </a>{' '}
            和{' '}
            <a href="#" className="underline hover:text-white transition-colors">
              隐私政策
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;