import React, { useState, useEffect, useRef } from 'react';

interface SearchableSelectOption {
  value: string;
  label: string;
  isFixed?: boolean;
}

interface SearchableSelectProps {
  label: string;
  value: string;
  options: SearchableSelectOption[];
  onChange: (val: string) => void;
  onDelete?: (val: string) => void;
  placeholder?: string;
  allowCustom?: boolean;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  value,
  options,
  onChange,
  onDelete,
  placeholder = "Pesquisar...",
  allowCustom,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value) || (value ? { value, label: value } : null);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="flex justify-between items-center mb-1.5 px-0.5">
        <label className="text-sm font-bold text-slate-700">{label}</label>
        {allowCustom && (
          <button 
            type="button"
            onClick={() => { setIsOpen(true); setSearchTerm(""); }}
            className="text-[10px] font-black uppercase tracking-widest text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
          >
            <Plus size={10} /> Novo
          </button>
        )}
      </div>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-12 px-4 bg-white border ${isOpen ? 'border-brand-500' : 'border-slate-300'} rounded-lg flex items-center justify-between cursor-pointer transition-all shadow-sm`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className={`text-base font-medium ${selectedOption ? 'text-slate-900' : 'text-slate-400'}`}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <Search size={18} className="text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="p-2 bg-slate-50 border-b border-slate-100">
            <input
              type="text"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm outline-none focus:border-brand-500"
              placeholder="Digite para filtrar ou adicionar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div
                  key={opt.value}
                  className={`flex items-center justify-between gap-3 px-3 py-2 rounded cursor-pointer group ${value === opt.value ? 'bg-brand-50 text-brand-700 font-bold' : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium'}`}
                  onClick={() => { onChange(opt.value); setIsOpen(false); setSearchTerm(""); }}
                >
                  <span className="text-sm truncate">{opt.label}</span>
                  <div className="flex items-center gap-2">
                    {onDelete && !opt.isFixed && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete(opt.value); }}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 rounded transition-all"
                        title="Remover"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    {value === opt.value && <CheckCircle2 size={14} className="text-brand-500" />}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest bg-slate-50/50">
                Nenhum resultado
              </div>
            )}
            
            {allowCustom && searchTerm && !filteredOptions.some(o => o.label.toLowerCase() === searchTerm.toLowerCase()) && (
              <div 
                onClick={() => { onChange(searchTerm); setIsOpen(false); setSearchTerm(""); }}
                className="mt-1 border-t border-slate-100 p-2 hover:bg-brand-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 text-brand-600 px-2 py-1">
                  <Plus size={14} />
                  <span className="text-sm font-black uppercase tracking-wider">Adicionar "{searchTerm}"</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Import icons
import { Search, Plus, Trash2, CheckCircle2 } from 'lucide-react';