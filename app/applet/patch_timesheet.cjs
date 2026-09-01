const fs = require('fs');
let code = fs.readFileSync('src/components/Timesheet/TimesheetManager.tsx', 'utf-8');

// Add import for KpiEvaluatorModal
if (!code.includes('KpiEvaluatorModal')) {
  code = code.replace(
    "import { formatVND, formatMonthDisplay } from '../../utils/formatters';",
    "import { formatVND, formatMonthDisplay } from '../../utils/formatters';\nimport { KpiEvaluatorModal } from '../Evaluation/KpiEvaluatorModal';"
  );
}

// Add evaluatingStaff state inside TimesheetManager component
if (!code.includes('evaluatingStaff')) {
  code = code.replace(
    "const [showSingleModal, setShowSingleModal] = useState<boolean>(false);",
    "const [showSingleModal, setShowSingleModal] = useState<boolean>(false);\n  const [evaluatingStaff, setEvaluatingStaff] = useState<Staff | null>(null);"
  );
}

// Make checklist badge clickable
const oldBadge = `                          {assignedChecklists.map(c => (
                            <div key={c.id} className="flex items-center bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 shadow-sm" title={c.title}>
                              <span className="font-mono text-[9px] font-bold text-slate-600 mr-1.5 border-r border-slate-200 pr-1.5">
                                {c.code}
                              </span>
                              <span className={\`text-[9px] font-bold font-mono \${kpiScoresMap[c.id] < 100 ? 'text-rose-600' : 'text-emerald-600'}\`}>
                                {kpiScoresMap[c.id]}%
                              </span>
                            </div>
                          ))}
`;

const newBadge = `                          {assignedChecklists.map(c => (
                            <button
                              type="button"
                              key={c.id}
                              onClick={() => setEvaluatingStaff(staff)}
                              className="flex items-center bg-slate-50 hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 rounded px-1.5 py-0.5 shadow-2xs transition-all cursor-pointer text-left group"
                              title={\`Nhấn để chấm/sửa bảng kiểm: \${c.title}\`}
                            >
                              <span className="font-mono text-[9px] font-bold text-slate-600 group-hover:text-indigo-700 mr-1.5 border-r border-slate-200 group-hover:border-indigo-200 pr-1.5">
                                {c.code}
                              </span>
                              <span className={\`text-[9px] font-bold font-mono \${kpiScoresMap[c.id] < 100 ? 'text-rose-600' : 'text-emerald-600'}\`}>
                                {kpiScoresMap[c.id]}%
                              </span>
                            </button>
                          ))}
`;

if (code.includes(oldBadge)) {
  code = code.replace(oldBadge, newBadge);
} else {
  console.log("Warning: oldBadge exact match not found, trying fallback regex or substring");
}

// Add KpiEvaluatorModal render at the end
const oldEnd = `            </form>
          </div>
        </div>
      )}
    </div>
  );
};`;

const newEnd = `            </form>
          </div>
        </div>
      )}

      {/* KPI EVALUATOR MODAL */}
      {evaluatingStaff && (
        <KpiEvaluatorModal
          initialStaff={evaluatingStaff}
          onClose={() => setEvaluatingStaff(null)}
        />
      )}
    </div>
  );
};`;

if (code.includes(oldEnd)) {
  code = code.replace(oldEnd, newEnd);
}

fs.writeFileSync('src/components/Timesheet/TimesheetManager.tsx', code);
console.log("TimesheetManager patched successfully!");
