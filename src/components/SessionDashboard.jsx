
import React, { useState, useEffect } from 'react';
import { useSettingsContext } from '../context/SettingsContext';
import { Check, ChevronDown, ChevronUp, Save, ArrowLeft, History, Download, FileText, MessageSquare, ArrowUp, ArrowDown } from 'lucide-react';

const Tile = ({ label, value, subValues, hasSub, subDirectlyVisible, useArrows, compact, onClick, onSubClick, onContextMenu, className = '' }) => {
  const isActive = value === 'X' || (hasSub && (subValues?.sub1 === 'X' || subValues?.sub2 === 'X')) || (value && value !== 'X' && value !== '↑' && value !== '↓' && !useArrows);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`
        relative flex flex-col rounded-lg border-2 transition-all duration-200 overflow-hidden select-none
        ${isActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/60 dark:border-indigo-400 shadow-md ring-1 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-indigo-300 dark:hover:border-slate-500'}
        ${compact ? 'border' : 'border-2'}
        ${className}
      `}
      onContextMenu={(e) => {
        e.preventDefault();
        if (onContextMenu) onContextMenu(e);
      }}
    >
      <div
        className={`flex ${useArrows ? 'flex-col' : 'flex-row'} items-center ${useArrows ? 'gap-0.5' : 'justify-between'} ${compact ? 'p-1' : 'p-1.5'} cursor-pointer min-h-[1.75rem]`}
        onClick={() => {
          if (hasSub && !subDirectlyVisible) {
            setIsExpanded(!isExpanded);
          } else if (!useArrows) {
            onClick();
          }
        }}
      >
        <span className={`${compact ? 'text-[0.55rem]' : 'text-[0.6rem]'} font-bold uppercase tracking-wide ${isActive ? 'text-indigo-700 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-300'} ${useArrows ? 'text-center leading-tight' : ''} truncate w-full`}>
          {label}
        </span>
        {useArrows ? (
          <div className="flex gap-0.5 justify-center w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => { e.stopPropagation(); onClick('↑'); }}
              className={`p-0.5 rounded transition-all ${value === '↑' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300 hover:bg-slate-200'}`}
              title="Flèche haut"
            >
              <ArrowUp size={8} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClick('↓'); }}
              className={`p-0.5 rounded transition-all ${value === '↓' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300 hover:bg-slate-200'}`}
              title="Flèche bas"
            >
              <ArrowDown size={8} />
            </button>
          </div>
        ) : (
          <>
            {value && value !== 'X' && !hasSub && (
              <span className={`${compact ? 'text-[0.5rem]' : 'text-[0.6rem]'} font-bold bg-indigo-600 text-white px-1 py-0.5 rounded shadow-sm scale-90`}>
                {value}
              </span>
            )}
            {value === 'X' && !hasSub && <Check size={compact ? 10 : 12} className="text-indigo-600" />}
          </>
        )}
      </div>
      {hasSub && (isExpanded || subDirectlyVisible) && (
        <div className={`bg-slate-50 border-t border-indigo-100 ${compact ? 'p-0.5 gap-0.5' : 'p-1 gap-1'} grid grid-cols-2 animate-in slide-in-from-top-2 ${subDirectlyVisible ? 'pt-0 border-t-0 bg-transparent' : ''}`}>
          <button
            onClick={(e) => { e.stopPropagation(); onSubClick('sub1'); }}
            className={`${compact ? 'px-0.5 py-0' : 'px-1 py-0.5'} rounded text-[0.5rem] font-black transition-all ${subValues?.sub1 === 'X' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-100'}`}
          >
            INTR
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSubClick('sub2'); }}
            className={`${compact ? 'px-0.5 py-0' : 'px-1 py-0.5'} rounded text-[0.5rem] font-black transition-all ${subValues?.sub2 === 'X' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-100'}`}
          >
            YSIO
          </button>
        </div>
      )}
    </div>
  );
};
const SessionDashboard = ({
  grids,
  referenceData,
  onToggle,
  onContextMenu,
  onSave,
  onDownload,
  sessionAnamnesis,
  setSessionAnamnesis,
  sessionComments,
  setSessionComments
}) => {
  const { defaultViewMode, compactMode } = useSettingsContext();
  const [activeTab, setActiveTab] = useState('poyet');
  const [viewMode, setViewMode] = useState(defaultViewMode || 'tabs'); // 'tabs' or 'all'
  const [expandedSutures, setExpandedSutures] = useState({}); // { BoneName: boolean }

  // Sync with defaultViewMode if it changes in settings while open, or just use it as initial
  useEffect(() => {
    if (defaultViewMode) setViewMode(defaultViewMode);
  }, [defaultViewMode]);
  const currentRow = 0;

  if (!grids || !referenceData) return <div className="p-10 text-center">Chargement de la séance...</div>;

  const toggleGroup = (groupName) => {
    setExpandedSutures(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const sections = [
    { id: 'poyet', label: 'Poyet', color: 'bg-indigo-500', icon: <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> },
    { id: 'organes', label: 'Organes', color: 'bg-rose-500', icon: <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> },
    { id: 'somato', label: 'Somato', color: 'bg-teal-500', icon: <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div> },
    { id: 'sutures', label: 'Sutures', color: 'bg-amber-500', icon: <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> },
    { id: 'intraOsseuse', label: 'Intra Osseuse', color: 'bg-purple-500', icon: <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> },
    { id: 'specifique', label: 'Spécifique', color: 'bg-emerald-500', icon: <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> }
  ];

  const renderSectionGrids = (sectionId, compact = false) => {
    switch (sectionId) {
      case 'poyet':
        return (
          <div className={`grid poyet-grid ${compact ? 'gap-0.5' : 'gap-1'} pr-1`}>
            {referenceData.poyet.columns.slice(1).map((col, idx) => {
              const colIndex = idx + 1;
              const useArrows = referenceData.poyet.arrowColumns &&
                referenceData.poyet.arrowColumns.includes(colIndex);

              return (
                <Tile
                  key={col}
                  label={col}
                  compact={compact}
                  value={grids.poyet[currentRow]?.[colIndex]}
                  useArrows={useArrows}
                  onClick={(val) => onToggle('poyet', currentRow, colIndex, null, val)}
                  onContextMenu={(e) => onContextMenu('poyet', currentRow, colIndex, e)}
                />
              );
            })}
          </div>
        );
      case 'organes':
        return (
          <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 ${compact ? 'gap-0.5' : 'gap-1'} pr-1`}>
            {referenceData.organes.columns.slice(1).map((col, idx) => (
              <Tile
                key={col}
                label={col}
                hasSub={true}
                compact={compact}
                subDirectlyVisible={true}
                subValues={grids.organes[currentRow]?.[idx + 1]}
                onSubClick={(sub) => onToggle('organes', currentRow, idx + 1, sub)}
              />
            ))}
          </div>
        );
      case 'somato':
        return (
          <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 ${compact ? 'gap-0.5' : 'gap-1'} pr-1`}>
            {referenceData.somato.columns.slice(1).map((col, idx) => (
              <Tile
                key={col}
                label={col}
                compact={compact}
                value={grids.somato[currentRow]?.[idx + 1]}
                onClick={() => onToggle('somato', currentRow, idx + 1)}
                onContextMenu={(e) => onContextMenu('somato', currentRow, idx + 1, e)}
              />
            ))}
          </div>
        );
      case 'sutures':
        return (
          <div className={`flex flex-col ${compact ? 'gap-1.5' : 'gap-3'} pr-1`}>
            {referenceData.sutures.groups ? (
              referenceData.sutures.groups.map(group => {
                const isExpanded = expandedSutures[group.name];
                return (
                  <div key={group.name} className={`flex flex-col ${compact ? 'gap-1' : 'gap-2'} bg-white/40 dark:bg-slate-800/40 rounded-xl ${compact ? 'p-1' : 'p-2'} border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-600`}>
                    <button
                      onClick={() => toggleGroup(group.name)}
                      className={`flex items-center justify-between w-full px-2 ${compact ? 'py-0.5' : 'py-1.5'} bg-amber-50 dark:bg-amber-900/40 rounded-lg border border-amber-100 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors group`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-2.5 bg-amber-500 rounded-full"></div>
                        <h4 className={`${compact ? 'text-[0.55rem]' : 'text-[0.65rem]'} font-black uppercase tracking-widest text-amber-800 dark:text-amber-400`}>{group.name}</h4>
                        <span className="text-[0.55rem] text-amber-600/70 dark:text-amber-500/70 font-bold ml-1">({group.columns.length})</span>
                      </div>
                      <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={compact ? 12 : 14} className="text-amber-500" />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className={`grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 ${compact ? 'gap-1' : 'gap-2'} animate-in fade-in duration-200`}>
                        {group.columns.map(colIndex => {
                          const col = referenceData.sutures.columns[colIndex];
                          return (
                            <Tile
                              key={col}
                              label={col}
                              compact={compact}
                              value={grids.sutures[currentRow]?.[colIndex]}
                              onClick={() => onToggle('sutures', currentRow, colIndex)}
                              onContextMenu={(e) => onContextMenu('sutures', currentRow, colIndex, e)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {referenceData.sutures.columns.slice(1).map((col, idx) => (
                  <Tile
                    key={col}
                    label={col}
                    compact={compact}
                    value={grids.sutures[currentRow]?.[idx + 1]}
                    onClick={() => onToggle('sutures', currentRow, idx + 1)}
                    onContextMenu={(e) => onContextMenu('sutures', currentRow, idx + 1, e)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      case 'intraOsseuse':
        return (
          <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 ${compact ? 'gap-0.5' : 'gap-1'} pr-1`}>
            {referenceData.intraOsseuse.columns.slice(1).map((col, idx) => (
              <Tile
                key={col}
                label={col}
                compact={compact}
                value={grids.intraOsseuse[currentRow]?.[idx + 1]}
                onClick={() => onToggle('intraOsseuse', currentRow, idx + 1)}
                onContextMenu={(e) => onContextMenu('intraOsseuse', currentRow, idx + 1, e)}
              />
            ))}
          </div>
        );
      case 'specifique':
        return (
          <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 ${compact ? 'gap-0.5' : 'gap-1'} pr-1`}>
            {referenceData.specifique.columns.slice(1).map((col, idx) => (
              <Tile
                key={col}
                label={col}
                compact={compact}
                value={grids.specifique[currentRow]?.[idx + 1]}
                onClick={() => onToggle('specifique', currentRow, idx + 1)}
                onContextMenu={(e) => onContextMenu('specifique', currentRow, idx + 1, e)}
              />
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const [showNotes, setShowNotes] = useState(false);

  return (
    <div className="h-full flex flex-col">
      {/* Session Notes Section - Collapsible in 'all' view */}
      <div className={`flex-shrink-0 transition-all duration-300 ${viewMode === 'all' && !showNotes ? 'mb-2' : 'mb-4'}`}>
        {viewMode === 'all' && !showNotes ? (
          <button
            onClick={() => setShowNotes(true)}
            className="w-full flex items-center justify-between bg-white/50 p-2 rounded-lg border border-slate-200 border-dashed hover:bg-white hover:border-indigo-200 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-indigo-600 transition-colors">
                <FileText size={14} />
                <span className="text-[0.65rem] font-bold uppercase tracking-wider">Anamnèse</span>
                {sessionAnamnesis && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full ml-0.5"></div>}
              </div>
              <div className="h-3 w-px bg-slate-300"></div>
              <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-purple-600 transition-colors">
                <MessageSquare size={14} />
                <span className="text-[0.65rem] font-bold uppercase tracking-wider">Notes</span>
                {sessionComments && <div className="w-1.5 h-1.5 bg-purple-500 rounded-full ml-0.5"></div>}
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600" />
          </button>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 ${viewMode === 'all' ? 'gap-2' : 'gap-3'} animate-in fade-in slide-in-from-top-2`}>
            <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md ${viewMode === 'all' ? 'p-2' : 'p-3'}`}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <FileText size={14} className="text-indigo-500" />
                  Anamnèse (Motif)
                </h3>
                {viewMode === 'all' && (
                  <button onClick={() => setShowNotes(false)} className="text-slate-400 hover:text-slate-600"><ChevronUp size={14} /></button>
                )}
              </div>
              <textarea
                value={sessionAnamnesis}
                onChange={(e) => setSessionAnamnesis(e.target.value)}
                className={`w-full ${viewMode === 'all' ? 'h-16' : 'h-16'} p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-[0.75rem] transition-all bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400`}
                placeholder="Motif de consultation..."
              />
            </div>
            <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md ${viewMode === 'all' ? 'p-2' : 'p-3'}`}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <MessageSquare size={14} className="text-purple-500" />
                  Commentaires
                </h3>
                {viewMode === 'all' && (
                  <button onClick={() => setShowNotes(false)} className="text-slate-400 hover:text-slate-600"><ChevronUp size={14} /></button>
                )}
              </div>
              <textarea
                value={sessionComments}
                onChange={(e) => setSessionComments(e.target.value)}
                className={`w-full ${viewMode === 'all' ? 'h-16' : 'h-16'} p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none text-[0.75rem] transition-all bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400`}
                placeholder="Observations..."
              />
            </div>
          </div>
        )}
      </div>

      {/* View Mode & Tab Bar */}
      <div className={`flex flex-col md:flex-row ${viewMode === 'all' ? 'gap-1 mb-1' : 'gap-2 mb-3'} items-center flex-shrink-0`}>
        <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-0.5 rounded-lg w-full md:w-auto self-stretch">
          <button
            onClick={() => setViewMode('tabs')}
            className={`flex-1 md:w-20 px-2 py-1.5 rounded-md text-[0.6rem] font-black transition-all ${viewMode === 'tabs' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm scale-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            ONGLETS
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`flex-1 md:w-20 px-2 py-1.5 rounded-md text-[0.6rem] font-black transition-all ${viewMode === 'all' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm scale-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            TOUT VOIR
          </button>
        </div>

        {viewMode === 'tabs' && (
          <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-0.5 rounded-lg overflow-x-auto no-scrollbar gap-1 flex-1 w-full md:w-auto">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={`
                  flex-1 min-w-[75px] px-2 py-1.5 rounded-md text-[0.55rem] font-black transition-all flex items-center justify-center gap-1.5 uppercase tracking-tighter
                  ${activeTab === section.id
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm scale-100'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50 scale-95'}
                `}
              >
                {section.icon}
                {section.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grids Section */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl p-1 border border-slate-200 dark:border-slate-800 border-dashed">
        {viewMode === 'tabs' ? (
          <div className="animate-in fade-in duration-300">
            {renderSectionGrids(activeTab, compactMode)}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-10">
            {sections.map(section => (
              <div key={section.id} className="flex flex-col gap-1.5 border border-slate-200/40 dark:border-slate-700/40 bg-white/30 dark:bg-slate-800/30 rounded-lg p-1.5">
                <div className="flex items-center gap-2 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 py-1 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <h3 className="text-[0.6rem] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                    {section.icon}
                    {section.label}
                  </h3>
                </div>
                {renderSectionGrids(section.id, compactMode)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionDashboard;
