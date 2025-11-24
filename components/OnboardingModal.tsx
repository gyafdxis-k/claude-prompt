'use client';

import { useState } from 'react';

type AppMode = 'workflow' | 'prompt';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (selectedMode: AppMode, projectPath?: string) => void;
}

export default function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [selectedMode, setSelectedMode] = useState<AppMode>('workflow');
  const [projectPath, setProjectPath] = useState('');
  const [isSelectingFolder, setIsSelectingFolder] = useState(false);

  if (!isOpen) return null;

  const handleComplete = () => {
    onComplete(selectedMode, projectPath);
  };

  const handleSelectFolder = async () => {
    setIsSelectingFolder(true);
    try {
      const response = await fetch('/api/folder/select');
      const data = await response.json();
      if (data.path) {
        setProjectPath(data.path);
      }
    } catch (error) {
      console.error('选择文件夹失败:', error);
    } finally {
      setIsSelectingFolder(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {step === 1 && (
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🚀</div>
              <h1 className="text-3xl font-bold mb-3">欢迎使用 Claude Dev Assistant</h1>
              <p className="text-gray-600 text-lg">
                强大的 AI 驱动开发助手，让编程更高效
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors">
                <div className="text-4xl mb-3">🔄</div>
                <h3 className="font-bold text-lg mb-2">工作流模式</h3>
                <ul className="text-sm text-gray-600 space-y-1.5">
                  <li>• 多步骤自动化流程</li>
                  <li>• 从需求到上线全流程</li>
                  <li>• 代码审查、测试生成</li>
                  <li>• 适合完整功能开发</li>
                </ul>
              </div>

              <div className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors">
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="font-bold text-lg mb-2">Prompt 模式</h3>
                <ul className="text-sm text-gray-600 space-y-1.5">
                  <li>• 单次快速执行</li>
                  <li>• 丰富的 Prompt 模板库</li>
                  <li>• 参数化灵活配置</li>
                  <li>• 适合单一任务快速完成</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <span>💡</span> 核心价值
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ 自动化重复性开发任务，节省 80% 时间</li>
                <li>✓ 提供代码审查和质量保证</li>
                <li>✓ 自动生成测试用例和文档</li>
                <li>✓ 支持自定义工作流和 Prompt 模板</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                跳过引导
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
              >
                下一步 →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold mb-2">选择你的使用模式</h2>
              <p className="text-gray-600">根据你的需求选择合适的模式开始</p>
            </div>

            <div className="space-y-3 mb-8">
              <button
                onClick={() => setSelectedMode('workflow')}
                className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                  selectedMode === 'workflow'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`text-4xl ${selectedMode === 'workflow' ? 'scale-110' : ''} transition-transform`}>
                    🔄
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">工作流模式</h3>
                    <p className="text-sm text-gray-600">
                      推荐新手使用，完整的开发流程指引
                    </p>
                  </div>
                  {selectedMode === 'workflow' && (
                    <div className="text-blue-600 text-2xl">✓</div>
                  )}
                </div>
              </button>

              <button
                onClick={() => setSelectedMode('prompt')}
                className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                  selectedMode === 'prompt'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`text-4xl ${selectedMode === 'prompt' ? 'scale-110' : ''} transition-transform`}>
                    ⚡
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">Prompt 模式</h3>
                    <p className="text-sm text-gray-600">
                      适合有经验的用户，快速执行单个任务
                    </p>
                  </div>
                  {selectedMode === 'prompt' && (
                    <div className="text-blue-600 text-2xl">✓</div>
                  )}
                </div>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                ← 上一步
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
              >
                下一步 →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">📁</div>
              <h2 className="text-2xl font-bold mb-2">设置项目路径（可选）</h2>
              <p className="text-gray-600">选择你要开发的项目文件夹</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-3 text-gray-700">
                项目路径
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={projectPath}
                  onChange={(e) => setProjectPath(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="/path/to/your/project"
                />
                <button
                  onClick={handleSelectFolder}
                  disabled={isSelectingFolder}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium whitespace-nowrap disabled:bg-gray-400"
                >
                  {isSelectingFolder ? '⏳ 选择中...' : '📁 选择文件夹'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 提示：你也可以稍后在设置中配置项目路径
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                <span>⚡</span> 快速上手
              </h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>1. 在左侧选择一个工作流或 Prompt 模板</li>
                <li>2. 填写必要的参数（如需求描述、文件路径等）</li>
                <li>3. 点击执行按钮，查看实时生成的结果</li>
                <li>4. 随时可以继续对话或完成当前步骤</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                ← 上一步
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg"
              >
                🚀 开始使用
              </button>
            </div>
          </div>
        )}

        <div className="px-8 pb-6">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
