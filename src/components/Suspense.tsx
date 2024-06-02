/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  ComponentType,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

type ComponentModule = { default: ComponentType<any> };

type LazyComponentImportFn = () => Promise<ComponentModule>;

class LazyWrapper {
  private locked: boolean = false;
  private onResolve: (() => void) | null = null;
  private resolved = false;
  private _comp: ReactNode;
  public get comp() {
    return this._comp;
  }

  constructor(private importFn: LazyComponentImportFn) {
    const load = () =>
      new Promise<ComponentModule>((resolve, reject) => {
        this.importFn()
          .then((m) => {
            if (this.locked) {
              this.onResolve = () => resolve(m);
            } else {
              this.resolved = true;
              resolve(m);
            }
          })
          .catch(reject);
      });
    const Comp = React.lazy(load);
    this._comp = <Comp />;
  }

  setLoadingLock(locked: boolean): boolean {
    if (this.resolved) {
      return false;
    }
    this.locked = locked;
    if (!locked) {
      this.onResolve?.();
      this.onResolve = null;
    }
    return true;
  }
}

function DelayLoading(props: {
  delay: number;
  showTime: number;
  lock: (locked: boolean) => boolean;
  children: ReactNode;
}) {
  const { delay, showTime, lock, children } = props;
  const [showLoading, setShowLoading] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (lock(true)) {
        /* 如果已经成功加载模块，那么不再显示loading */
        setShowLoading(true);
      }
    }, delay);
    return () => {
      clearTimeout(timer);
      lock(false);
    };
  }, [delay, lock]);

  useEffect(() => {
    if (!showLoading) {
      return;
    }
    const timer = setTimeout(() => {
      lock(false);
    }, showTime);
    return () => clearTimeout(timer);
  }, [showLoading, lock, showTime]);

  return showLoading ? children : null;
}

interface Props {
  loadingDelay: number;
  loadingShowTime: number;
  loading: ReactNode;
  lazy: LazyComponentImportFn;
}

export default function Suspense(props: Props) {
  const { loadingDelay, loadingShowTime, loading } = props;
  const wrapperRef = useRef(new LazyWrapper(props.lazy));
  const lockRef = useRef((locked: boolean) =>
    wrapperRef.current.setLoadingLock(locked)
  );

  const delayLoading = (
    <DelayLoading
      delay={loadingDelay}
      showTime={loadingShowTime}
      lock={lockRef.current}
    >
      {loading}
    </DelayLoading>
  );

  return (
    <React.Suspense fallback={delayLoading}>
      {wrapperRef.current.comp}
    </React.Suspense>
  );
}
