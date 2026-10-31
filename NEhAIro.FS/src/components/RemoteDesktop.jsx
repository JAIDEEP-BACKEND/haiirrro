import React, { useState, useEffect, useRef } from 'react';
import { 
  Monitor, Play, Square, MousePointer2, Keyboard, 
  Maximize2, Minimize2, RefreshCw, ShieldAlert, Terminal
} from 'lucide-react';
import { WS_BASE } from '../services/api';

export default function RemoteDesktop() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [frame, setFrame] = useState(null);
  const [resolution, setResolution] = useState({ width: 1920, height: 1080 });
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const inputRef = useRef(null);
  const wsRef = useRef(null);
  const lastEmitTime = useRef(0);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(Date.now());
  const lastTouchTime = useRef(0);

  useEffect(() => {
    const ws = new WebSocket(WS_BASE);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'SCREEN_INIT') {
          setResolution({ width: data.width || 1920, height: data.height || 1080 });
        } else if (data.type === 'SCREEN_FRAME') {
          setFrame(data.frame);
          if (data.timestamp) {
            setLatency(Date.now() - data.timestamp);
          }
          frameCountRef.current++;
          const now = Date.now();
          if (now - lastFpsTimeRef.current >= 1000) {
            setFps(frameCountRef.current);
            frameCountRef.current = 0;
            lastFpsTimeRef.current = now;
          }
        }
      } catch (e) {}
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'STOP_SCREEN_STREAM' }));
        ws.close();
      }
    };
  }, []);

  const toggleStream = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (isStreaming) {
      wsRef.current.send(JSON.stringify({ type: 'STOP_SCREEN_STREAM' }));
      setIsStreaming(false);
    } else {
      wsRef.current.send(JSON.stringify({ type: 'START_SCREEN_STREAM' }));
      setIsStreaming(true);
    }
  };

  const emitInput = (type, clientX, clientY, button = 0) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !imageRef.current) return;

    if (type === 'mousemove') {
      const now = Date.now();
      if (now - lastEmitTime.current < 25) return;
      lastEmitTime.current = now;
    }

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = resolution.width / rect.width;
    const scaleY = resolution.height / rect.height;

    const rx = Math.round((clientX - rect.left) * scaleX);
    const ry = Math.round((clientY - rect.top) * scaleY);

    if (rx >= 0 && rx <= resolution.width && ry >= 0 && ry <= resolution.height) {
      wsRef.current.send(JSON.stringify({
        type: 'REMOTE_INPUT',
        payload: { type, x: rx, y: ry, button }
      }));
    }
  };

  const handleMouseEvent = (e) => {
    if (!isStreaming) return;
    let type = '';
    if (e.type === 'mousemove') type = 'mousemove';
    else if (e.type === 'mousedown') type = 'mousedown';
    else if (e.type === 'mouseup') type = 'mouseup';
    else if (e.type === 'dblclick') type = 'doubleclick';

    if (type) {
      emitInput(type, e.clientX, e.clientY, e.button);
    }
  };

  const handleTouchEvent = (e) => {
    if (!isStreaming || e.touches.length === 0) return;
    const touch = e.touches[0];
    const now = Date.now();
    let type = '';

    if (e.type === 'touchstart') {
      const diff = now - lastTouchTime.current;
      type = diff < 300 ? 'doubleclick' : 'mousedown';
      lastTouchTime.current = now;
      emitInput('mousemove', touch.clientX, touch.clientY);
    } else if (e.type === 'touchmove') {
      type = 'mousemove';
      e.preventDefault();
    } else if (e.type === 'touchend') {
      type = 'mouseup';
    }

    if (type) emitInput(type, touch.clientX, touch.clientY);
  };

  const handleKeyDown = (e) => {
    if (!isStreaming || !wsRef.current) return;
    if (['Tab', 'Backspace', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
    wsRef.current.send(JSON.stringify({
      type: 'REMOTE_INPUT',
      payload: { type: 'keydown', key: e.key }
    }));
  };

  const handleHiddenInputChange = (e) => {
    const val = e.target.value;
    if (val.length > 0 && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'REMOTE_INPUT',
        payload: { type: 'keydown', key: val.slice(-1) }
      }));
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const toggleKeyboardFocus = () => {
    setShowKeyboard(!showKeyboard);
    if (!showKeyboard && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const toggleFullscreenMode = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#ffffff] overflow-hidden font-sans">
      {/* Top Swiss Toolbar */}
      <div className="bg-[#ffffff] border-b border-[#e2e8f0] px-5 py-2.5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 bg-black"></div>
          <div>
            <h1 className="text-xs font-bold font-mono text-black tracking-widest uppercase">
              Live Remote Desktop
            </h1>
            <p className="text-[10px] font-mono text-[#64748b]">
              {resolution.width}×{resolution.height} px // {isStreaming ? `${fps} FPS • ${latency}ms latency` : 'Standby'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleKeyboardFocus}
            title="Toggle Virtual Keyboard Input"
            className={`px-3 py-1.5 border text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors ${
              showKeyboard
                ? 'bg-black text-white border-black'
                : 'bg-white text-[#475569] border-[#e2e8f0] hover:text-black hover:border-black'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">KEYBOARD</span>
          </button>

          <button
            onClick={toggleFullscreenMode}
            title="Toggle Fullscreen"
            className="px-3 py-1.5 bg-white border border-[#e2e8f0] text-[#475569] hover:text-black hover:border-black text-xs font-mono flex items-center space-x-1.5 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'WINDOW' : 'EXPAND'}</span>
          </button>

          <button
            onClick={toggleStream}
            className={`px-5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-2 transition-colors ${
              isStreaming
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-black text-white hover:bg-neutral-800'
            }`}
          >
            {isStreaming ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>DISCONNECT</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>CONNECT STREAM</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Screen Canvas Container */}
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="flex-1 relative bg-[#090d16] overflow-hidden flex items-center justify-center outline-none select-none cursor-crosshair"
      >
        <input
          ref={inputRef}
          type="text"
          className="absolute opacity-0 pointer-events-none"
          onChange={handleHiddenInputChange}
          onKeyDown={(e) => {
            if (['Backspace', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
              handleKeyDown(e);
            }
          }}
        />

        {!isStreaming ? (
          <div className="flex flex-col items-center justify-center space-y-4 text-center p-8 max-w-md bg-white border border-[#e2e8f0] shadow-lg">
            <div className="w-14 h-14 bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center text-black mb-1">
              <Monitor className="w-7 h-7" />
            </div>
            <h2 className="text-xs font-mono font-bold text-black tracking-widest uppercase">
              Remote Display Stream Standby
            </h2>
            <p className="text-xs text-[#64748b] leading-relaxed">
              Click <strong className="text-black">CONNECT STREAM</strong> to initialize real-time video frame streaming and hardware input control.
            </p>
            <button
              onClick={toggleStream}
              className="px-6 py-2 bg-black text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
            >
              Start Session
            </button>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {frame ? (
              <img
                ref={imageRef}
                src={frame}
                alt="Remote Host Desktop"
                onMouseMove={handleMouseEvent}
                onMouseDown={handleMouseEvent}
                onMouseUp={handleMouseEvent}
                onDoubleClick={handleMouseEvent}
                onTouchStart={handleTouchEvent}
                onTouchMove={handleTouchEvent}
                onTouchEnd={handleTouchEvent}
                onContextMenu={(e) => e.preventDefault()}
                className="max-w-full max-h-full object-contain select-none shadow-2xl"
                draggable={false}
              />
            ) : (
              <div className="flex items-center space-x-2 font-mono text-xs text-white">
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Synchronizing video pipeline...</span>
              </div>
            )}

            {/* Overlay Status Badge */}
            <div className="absolute top-3 right-3 bg-white/95 border border-[#e2e8f0] px-3 py-1.5 flex items-center space-x-2 text-[10px] font-mono pointer-events-none shadow-sm">
              <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></div>
              <span className="text-black font-bold">HOST CONTROLLER ACTIVE</span>
            </div>
          </div>
        )}
      </div>

      {/* Swiss Bottom Bar */}
      <div className="bg-[#ffffff] border-t border-[#e2e8f0] px-5 py-2 flex items-center justify-between text-[11px] font-mono text-[#64748b]">
        <div className="flex items-center space-x-4">
          <span>Input Protocol: <strong className="text-black">Win32 API SendKeys / Cursor Event</strong></span>
          <span>Scaling: <strong className="text-black">Direct Aspect Ratio</strong></span>
        </div>
        <div>
          <span>Target Host: <strong className="text-black">Local Windows Subsystem</strong></span>
        </div>
      </div>
    </div>
  );
}
