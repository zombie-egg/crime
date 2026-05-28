import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error?: Error;
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App render failed", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="mx-auto max-w-3xl border-4 border-black bg-white p-6 shadow-[10px_10px_0_#111]">
        <div className="mb-4 inline-block border-4 border-black bg-[#e60012] px-3 py-1 text-sm font-black text-white">
          Render Error
        </div>
        <h1 className="text-3xl font-black text-black">页面组件渲染失败</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-neutral-700">
          我已经把错误边界加上了。当前错误信息如下，页面不会再白屏。
        </p>
        <pre className="mt-4 max-h-56 overflow-auto border-4 border-black bg-[#f7f3e8] p-3 text-xs text-black">
          {this.state.error.message}
        </pre>
        <Button className="mt-5" onClick={() => window.location.assign("/")}>
          返回首页
        </Button>
      </div>
    );
  }
}
