// ============================================================
// AutoHarvest — Code Editor Panel (Redux + Motion)
// ============================================================

import { useRef, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useAppSelector, useAppDispatch } from '../../store';
import { setDroneScript, setDroneStatus, selectDrones, DEFAULT_DRONE_SCRIPT } from '../../store/slices/gameSlice';
import { motion } from 'framer-motion';
import { Play, Square, RotateCcw, Code2, Bot } from 'lucide-react';

export function CodeEditorPanel() {
  const dispatch = useAppDispatch();
  const { isScriptRunning, selectedDroneForScript } = useAppSelector((s) => s.ui);
  const drones = useAppSelector(selectDrones);
  const selectedDrone = drones.find((d) => d.id === selectedDroneForScript);
  const editorRef = useRef<any>(null);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    monaco.editor.defineTheme('autoharvest', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '5A7D3A', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C0AB79' },
        { token: 'string', foreground: '90BE6D' },
        { token: 'number', foreground: 'F9C74F' },
        { token: 'function', foreground: 'A1AC6E' },
        { token: 'variable', foreground: 'D4C7A1' },
        { token: 'type', foreground: 'B09558' },
      ],
      colors: {
        'editor.background': '#141312',
        'editor.foreground': '#E3E2DF',
        'editor.lineHighlightBackground': '#1F1E1C',
        'editor.selectionBackground': '#3A3827',
        'editorCursor.foreground': '#90BE6D',
        'editorLineNumber.foreground': '#555249',
        'editorLineNumber.activeForeground': '#90BE6D',
        'editorIndentGuide.background': '#2A2825',
        'editorWidget.background': '#1A1918',
        'editorSuggestWidget.background': '#1A1918',
        'editorSuggestWidget.border': '#2A2825',
        'editorSuggestWidget.selectedBackground': '#2A2825',
        'scrollbar.shadow': '#00000000',
        'scrollbarSlider.background': '#2A282580',
      },
    });
    monaco.editor.setTheme('autoharvest');

    // Autocomplete for game API
    monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };
        const suggestions = [
          {
            label: 'moveUp',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'await moveUp();',
            detail: 'Move active entity up one tile',
            range,
          },
          {
            label: 'moveDown',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'await moveDown();',
            detail: 'Move active entity down one tile',
            range,
          },
          {
            label: 'moveLeft',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'await moveLeft();',
            detail: 'Move active entity left one tile',
            range,
          },
          {
            label: 'moveRight',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'await moveRight();',
            detail: 'Move active entity right one tile',
            range,
          },
          {
            label: 'plant',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'await plant("${1:wheat}");',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'Plant a crop on current tile',
            range,
          },
          {
            label: 'harvest',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'await harvest();',
            detail: 'Harvest crop on current tile',
            range,
          },
          {
            label: 'getTile',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'getTile()',
            detail: 'Get current tile info',
            range,
          },
          {
            label: 'getTileAt',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'getTileAt(${1:x}, ${2:y})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'Get tile at coordinates',
            range,
          },
          {
            label: 'getPosition',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'getPosition()',
            detail: 'Get active entity position',
            range,
          },
          {
            label: 'getInventory',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'getInventory()',
            detail: 'Get inventory contents',
            range,
          },
          {
            label: 'getEnergy',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'getEnergy()',
            detail: 'Get active entity energy',
            range,
          },
          {
            label: 'getDrones',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'getDrones()',
            detail: 'Get all drone statuses',
            range,
          },
          {
            label: 'getGridSize',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'getGridSize()',
            detail: 'Get farm grid dimensions {width, height}',
            range,
          },
          {
            label: 'log',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'log(${1:message});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'Log to console',
            range,
          },
          {
            label: 'getItemCount',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'getItemCount("${1:seed_wheat}")',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'Get quantity of a specific item or crop',
            range,
          },
          {
            label: 'moveTo',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'await moveTo(${1:x}, ${2:y});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'Navigate directly to specific coordinates',
            range,
          },
          {
            label: 'wait',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'await wait(${1:5});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'Wait N ticks',
            range,
          },
        ];
        return { suggestions };
      },
    });
  };

  const handleRun = useCallback(() => {
    if (!selectedDrone) return;
    dispatch(setDroneStatus({ droneId: selectedDrone.id, status: 'scripted' }));
  }, [selectedDrone, dispatch]);

  const handleStop = useCallback(() => {
    if (!selectedDrone) return;
    dispatch(setDroneStatus({ droneId: selectedDrone.id, status: 'idle' }));
  }, [selectedDrone, dispatch]);

  const handleReset = useCallback(() => {
    if (selectedDrone) {
      dispatch(setDroneScript({ droneId: selectedDrone.id, script: DEFAULT_DRONE_SCRIPT }));
    }
  }, [dispatch, selectedDrone]);

  if (drones.length === 0) {
    return (
      <div className="glass-panel-dark flex flex-col h-full overflow-hidden items-center justify-center p-6 text-center">
        <Bot className="w-12 h-12 text-farm-700 mb-4 mx-auto" />
        <h3 className="text-farm-300 font-display font-semibold mb-2">No Drones Available</h3>
        <p className="text-farm-500 text-sm">Buy a drone from the Shop first to start scripting!</p>
      </div>
    );
  }

  // If drones exist but none selected, select the first one
  if (!selectedDrone) {
    dispatch({ type: 'ui/setSelectedDroneForScript', payload: drones[0].id });
    return null;
  }

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.3 }}
      className="glass-panel-dark flex flex-col h-full overflow-hidden"
    >
      {/* Drone Tabs */}
      <div className="flex overflow-x-auto border-b border-farm-800/40 custom-scrollbar bg-farm-900/20">
        {drones.map((drone) => (
          <button
            key={drone.id}
            onClick={() => dispatch({ type: 'ui/setSelectedDroneForScript', payload: drone.id })}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              selectedDrone?.id === drone.id
                ? 'border-olive-500 text-olive-400 bg-farm-800/40'
                : 'border-transparent text-farm-500 hover:text-farm-300 hover:bg-farm-800/20'
            }`}
          >
            <Bot className="w-4 h-4" />
            {drone.name}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-farm-800/40 bg-farm-900/10">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-olive-400" />
          <span className="text-sm font-medium text-farm-300">
            Scripting: {selectedDrone?.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.button
            whileHover={{ scale: 1.1, rotate: -90 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleReset}
            className="p-1.5 rounded-lg text-farm-500 hover:text-farm-300 hover:bg-farm-800/40 transition-all"
            title="Reset script"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </motion.button>
          {selectedDrone?.status === 'scripted' ? (
            <motion.button
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStop}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 hover:bg-red-500/80 rounded-lg text-white text-xs font-medium transition-all"
            >
              <Square className="w-3 h-3" /> Stop
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRun}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-olive-600/80 hover:bg-olive-500/80 rounded-lg text-white text-xs font-medium transition-all"
            >
              <Play className="w-3 h-3" /> Run
            </motion.button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={selectedDrone.script || ''}
          onChange={(value) =>
            selectedDrone &&
            dispatch(setDroneScript({ droneId: selectedDrone.id, script: value || '' }))
          }
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineNumbers: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            wordWrap: 'on',
            tabSize: 2,
            renderLineHighlight: 'gutter',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            contextmenu: false,
          }}
          loading={
            <div className="flex items-center justify-center h-full text-farm-500 text-sm">
              Loading editor...
            </div>
          }
        />
      </div>
    </motion.div>
  );
}
