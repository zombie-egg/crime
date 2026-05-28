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
      <div className="mx-auto max-w-3xl rounded-2xl border border-fuchsia-400/20 bg-[#0b0714]/96 p-6 text-white shadow-[0_30px_90px_rgba(0,0,0,0.6)]">
        <div className="mb-4 inline-block rounded-md border border-red-500/40 bg-red-600/25 px-3 py-1 text-sm font-black text-red-50">
          Render Error
        </div>
        <h1 className="text-3xl font-black text-white">页面组件渲染失败</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-violet-100/72">
          我已经把错误边界加上了。当前错误信息如下，页面不会再白屏。
        </p>
        <pre className="mt-4 max-h-56 overflow-auto rounded-xl border border-fuchsia-400/20 bg-black/35 p-3 text-xs text-violet-100/75">
          {this.state.error.message}
        </pre>
        <Button className="mt-5" onClick={() => window.location.assign("/")}>
          返回首页
        </Button>
      </div>
    );
  }
}
