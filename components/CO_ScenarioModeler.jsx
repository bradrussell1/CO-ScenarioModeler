import React, { useState, useMemo, useCallback } from 'react'

// ─── ID Generator ──────────────────────────────────────────────────────────────
let _seq = 200
const uid = () => String(++_seq)

// ─── Formatters ────────────────────────────────────────────────────────────────
const fmt$ = (v) => {
  const n = Math.round(Number(v))
  if (isNaN(n)) return '—'
  return '$' + n.toLocaleString('en-US')
}

const parseNum = (v) => {
  if (v === '' || v === null || v === undefined) return 0
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''))
  return isNaN(n) ? 0 : n
}

// ─── Seed Data IDs ────────────────────────────────────────────────────────────
const A1 = 'a1', A2 = 'a2', A3 = 'a3'
const S1 = 's1', S2 = 's2'

// ─── Fixed Ratecard Options ───────────────────────────────────────────────────
// Percentage suffix discounts the Total CO Value for that scenario.
// NA3 / NA4 with no suffix = no discount applied.
const RATECARD_OPTIONS = ['NA3', 'NA3-5%', 'NA3-10%', 'NA3-20%', 'NA4', 'NA4-5%', 'NA4-10%', 'NA4-20%']

const getRatecardDiscount = (name) => {
  const m = (name || '').match(/(\d+)%$/)
  return m ? parseInt(m[1], 10) : 0
}

const INIT_PROJECT = {
  name: 'Replit — Brand Platform Refresh',
  disclosedEstimate: 485000,
  discount: 8,
  laborOverride: null,
  currentEAC: 431000,
}

const INIT_ACTIVITIES = [
  { id: A1, name: 'Scope Expansion: Developer Hub Copy', hours: 40, dollarOverride: 7000 },
  { id: A2, name: 'Ad Hoc: Motion Design Revisions', hours: 28, dollarOverride: 4340 },
  { id: A3, name: 'OOP: Stock Photography & Licensing', hours: 0, dollarOverride: 4200 },
]

const INIT_SCENARIOS = [
  { id: S1, name: 'Scenario A', checkedIds: [A1, A3], budgetBasis: 'available', ratecardId: 'NA3' },
  { id: S2, name: 'Scenario B', checkedIds: [A1, A2, A3], budgetBasis: 'disclosed', ratecardId: 'NA4-5%' },
]

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:        '#090c12',
  panel:     '#0f1420',
  card:      '#141926',
  cardAlt:   '#111520',
  field:     '#0b0e17',
  border:    '#212840',
  borderH:   '#2e3654',
  t1:        '#e9ecf6',
  t2:        '#8c96b4',
  t3:        '#565f7a',
  amber:     '#f59e0b',
  amberDim:  '#b37806',
  amberBg:   '#160f00',
  amberB:    '#2e2000',
  green:     '#22c55e',
  greenBg:   '#031509',
  greenB:    '#0a2e14',
  red:       '#f87171',
  redBg:     '#150404',
  redB:      '#320c0c',
  yellow:    '#fbbf24',
  yellowBg:  '#130f00',
  yellowB:   '#3d2f00',
}

const inputSx = {
  background: C.field,
  border: `1px solid ${C.border}`,
  borderRadius: 3,
  color: C.t1,
  fontSize: 13,
  padding: '6px 8px',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function COScenarioModeler() {
  const [project,    setProject]    = useState(INIT_PROJECT)
  const [activities, setActivities] = useState(INIT_ACTIVITIES)
  const [scenarios,  setScenarios]  = useState(INIT_SCENARIOS)

  // ── Derived project values ─────────────────────────────────────────────────
  const autoLabor       = project.disclosedEstimate * (1 - project.discount / 100)
  const availableLabor  = project.laborOverride !== null ? project.laborOverride : autoLabor
  const projectVariance = availableLabor - project.currentEAC

  // ── Activity value (dollar override or 0) ─────────────────────────────────
  const getActivityValue = useCallback((activity) => {
    return activity.dollarOverride !== null ? activity.dollarOverride : 0
  }, [])

  // ── Scenario computation ──────────────────────────────────────────────────
  const computeScenario = useCallback((scenario) => {
    const preCoB = scenario.budgetBasis === 'disclosed'
      ? project.disclosedEstimate
      : availableLabor
    const rawCO = scenario.checkedIds.reduce((sum, id) => {
      const act = activities.find(a => a.id === id)
      return act ? sum + getActivityValue(act) : sum
    }, 0)
    const discountPct       = getRatecardDiscount(scenario.ratecardId)
    const totalCO           = Math.round(rawCO * (1 - discountPct / 100))
    const newTotalBudget    = preCoB + totalCO
    const newEAC            = project.currentEAC + totalCO
    const remainingVariance = newTotalBudget - newEAC
    const perceptionFlag    = scenario.budgetBasis === 'disclosed' && newTotalBudget < project.disclosedEstimate
    return { preCoB, rawCO, discountPct, totalCO, newTotalBudget, newEAC, remainingVariance, perceptionFlag }
  }, [project, availableLabor, activities, getActivityValue])

  const scenarioResults = useMemo(
    () => scenarios.map(s => ({ ...s, ...computeScenario(s) })),
    [scenarios, computeScenario]
  )

  // ── Project handlers ──────────────────────────────────────────────────────
  const setPF = (field, value) => setProject(p => ({ ...p, [field]: value }))

  // ── Activity handlers ─────────────────────────────────────────────────────
  const addActivity = () =>
    setActivities(a => [...a, { id: uid(), name: '', hours: 0, dollarOverride: null }])
  const updActivity = (id, field, val) =>
    setActivities(a => a.map(x => x.id === id ? { ...x, [field]: val } : x))
  const delActivity = (id) => {
    setActivities(a => a.filter(x => x.id !== id))
    setScenarios(ss => ss.map(s => ({ ...s, checkedIds: s.checkedIds.filter(c => c !== id) })))
  }

  // ── Scenario handlers ─────────────────────────────────────────────────────
  const addScenario = () => {
    if (scenarios.length >= 4) return
    const letters = ['A', 'B', 'C', 'D']
    setScenarios(ss => [...ss, {
      id: uid(),
      name: `Scenario ${letters[ss.length]}`,
      checkedIds: [],
      budgetBasis: 'available',
      ratecardId: 'NA3',
    }])
  }
  const updScenario = (id, field, val) =>
    setScenarios(ss => ss.map(s => s.id === id ? { ...s, [field]: val } : s))
  const delScenario = (id) =>
    setScenarios(ss => ss.filter(s => s.id !== id))
  const toggleActivityInScenario = (scenarioId, actId) =>
    setScenarios(ss => ss.map(s => {
      if (s.id !== scenarioId) return s
      const has = s.checkedIds.includes(actId)
      return { ...s, checkedIds: has ? s.checkedIds.filter(c => c !== actId) : [...s.checkedIds, actId] }
    }))

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.t1, fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontSize: 13 }}>

      {/* ── App Header ── */}
      <header style={{
        background: C.panel,
        borderBottom: `1px solid ${C.border}`,
        padding: '11px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 20,
        height: 42,
        boxSizing: 'border-box',
      }}>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: C.t3, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          CO Scenario Modeler
        </span>
        <span style={{ color: C.borderH, fontSize: 14 }}>│</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.t1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {project.name || 'Untitled Project'}
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: C.t3, letterSpacing: '0.06em' }}>
            DISCLOSED EST <span style={{ fontFamily: 'monospace', color: C.t2 }}>{fmt$(project.disclosedEstimate)}</span>
          </span>
          <span style={{ color: C.border }}>│</span>
          <span style={{ fontSize: 10, color: C.t3, letterSpacing: '0.06em' }}>
            AVAIL LABOR <span style={{ fontFamily: 'monospace', color: C.t2 }}>{fmt$(availableLabor)}</span>
          </span>
          <span style={{ color: C.border }}>│</span>
          <span style={{ fontSize: 10, color: C.t3, letterSpacing: '0.06em' }}>
            BASELINE VARIANCE{' '}
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: projectVariance >= 0 ? C.green : C.red }}>
              {fmt$(projectVariance)}
            </span>
          </span>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div style={{ display: 'flex', height: 'calc(100vh - 42px)' }}>

        {/* ══ LEFT PANEL ══════════════════════════════════════════════════════ */}
        <aside style={{
          width: 320,
          minWidth: 320,
          background: C.panel,
          borderRight: `1px solid ${C.border}`,
          overflowY: 'auto',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }}>

          {/* ── Project Setup ── */}
          <section style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}` }}>
            <SectionHeading>Project Setup</SectionHeading>

            <FieldRow>
              <FieldLabel>Project Name</FieldLabel>
              <input
                style={inputSx}
                value={project.name}
                onChange={e => setPF('name', e.target.value)}
                placeholder="Project name…"
              />
            </FieldRow>

            <FieldRow>
              <FieldLabel>SOW Disclosed Estimate</FieldLabel>
              <CurrInput value={project.disclosedEstimate} onChange={v => setPF('disclosedEstimate', v)} />
            </FieldRow>

            <FieldRow>
              <FieldLabel>Discount</FieldLabel>
              <PctInput value={project.discount} onChange={v => setPF('discount', v)} />
            </FieldRow>

            <FieldRow>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <FieldLabel inline>Approved Available Labor</FieldLabel>
                {project.laborOverride !== null && (
                  <button
                    style={{ fontSize: 10, color: C.amber, background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.04em' }}
                    onClick={() => setPF('laborOverride', null)}
                  >
                    ↺ reset to auto
                  </button>
                )}
              </div>
              <CurrInput
                value={project.laborOverride !== null ? project.laborOverride : autoLabor}
                onChange={v => setPF('laborOverride', v)}
                dimmed={project.laborOverride === null}
              />
              {project.laborOverride === null && (
                <div style={{ fontSize: 10, color: C.t3, marginTop: 4, fontFamily: 'monospace' }}>
                  auto: {fmt$(project.disclosedEstimate)} × {100 - project.discount}% = {fmt$(autoLabor)}
                </div>
              )}
            </FieldRow>

            <FieldRow>
              <FieldLabel>Current EAC</FieldLabel>
              <CurrInput value={project.currentEAC} onChange={v => setPF('currentEAC', v)} />
            </FieldRow>

            {/* Budget Variance */}
            <div style={{
              marginTop: 6,
              padding: '10px 14px',
              background: projectVariance >= 0 ? C.greenBg : C.redBg,
              border: `1px solid ${projectVariance >= 0 ? C.greenB : C.redB}`,
              borderRadius: 4,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.t3, marginBottom: 2 }}>
                  Budget Variance
                </div>
                <div style={{ fontSize: 9, color: C.t3 }}>Avail. Labor − Current EAC</div>
              </div>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 18, color: projectVariance >= 0 ? C.green : C.red }}>
                {fmt$(projectVariance)}
              </span>
            </div>
          </section>

          {/* ── CO Activity Library ── */}
          <section style={{ padding: '18px 20px', flex: 1 }}>
            <SectionHeading>CO Activity Library</SectionHeading>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 94px 22px', gap: 6, marginBottom: 6 }}>
              <ColH>Activity</ColH>
              <ColH right>Hrs</ColH>
              <ColH right>$ Override</ColH>
              <span />
            </div>

            {activities.map(act => (
              <ActivityRow
                key={act.id}
                activity={act}
                onChange={(field, val) => updActivity(act.id, field, val)}
                onDelete={() => delActivity(act.id)}
              />
            ))}

            <AddBtn onClick={addActivity} style={{ marginTop: 10 }}>+ Add Activity</AddBtn>

            <div style={{ marginTop: 12, padding: '8px 10px', background: C.field, border: `1px solid ${C.border}`, borderRadius: 3 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.t3, marginBottom: 4 }}>Activity Logic</div>
              <div style={{ fontSize: 10, color: C.t3, lineHeight: 1.65 }}>
                <div>• <span style={{ color: C.amber }}>$ Value</span> — dollar amount for this activity</div>
                <div>• Hours field is for reference only</div>
                <div>• Ratecard discount applies to scenario Total CO</div>
              </div>
            </div>
          </section>
        </aside>

        {/* ══ RIGHT PANEL — SCENARIO BUILDER ══════════════════════════════════ */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: 24, minWidth: 0 }}>

          {/* ── Comparison Table ── */}
          {scenarios.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <SectionHeading>Scenario Comparison</SectionHeading>
              <ComparisonTable results={scenarioResults} />
            </div>
          )}

          {/* ── Scenario Cards ── */}
          <SectionHeading>Scenarios</SectionHeading>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {scenarioResults.map(sr => (
              <ScenarioCard
                key={sr.id}
                scenario={sr}
                activities={activities}
                currentEAC={project.currentEAC}
                disclosedEstimate={project.disclosedEstimate}
                getActivityValue={getActivityValue}
                onUpdate={(field, val) => updScenario(sr.id, field, val)}
                onToggle={actId => toggleActivityInScenario(sr.id, actId)}
                onRemove={() => delScenario(sr.id)}
              />
            ))}

            {scenarios.length < 4 && (
              <button
                onClick={addScenario}
                style={{
                  width: 240,
                  minHeight: 160,
                  background: C.card,
                  border: `2px dashed ${C.borderH}`,
                  borderRadius: 6,
                  color: C.t3,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  alignSelf: 'stretch',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 30, color: C.borderH, lineHeight: 1 }}>+</span>
                Add Scenario
                <span style={{ fontSize: 10, color: C.t3, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                  {scenarios.length}/4 active
                </span>
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function SectionHeading({ children }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.t3, marginBottom: 14 }}>
      {children}
    </div>
  )
}

function FieldLabel({ children, inline }) {
  const style = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: C.t2,
  }
  if (!inline) style.marginBottom = 4
  return <div style={style}>{children}</div>
}

function FieldRow({ children }) {
  return <div style={{ marginBottom: 12 }}>{children}</div>
}

function ColH({ children, right }) {
  return (
    <span style={{ fontSize: 9, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', textAlign: right ? 'right' : 'left' }}>
      {children}
    </span>
  )
}

function DelBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ background: 'none', border: 'none', color: C.t3, cursor: 'pointer', fontSize: 17, lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22 }}
      title="Remove"
    >
      ×
    </button>
  )
}

function AddBtn({ children, onClick, style: sx }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: `1px solid ${C.border}`,
        borderRadius: 3,
        color: C.t2,
        cursor: 'pointer',
        fontSize: 11,
        fontWeight: 600,
        padding: '5px 10px',
        letterSpacing: '0.04em',
        ...sx,
      }}
    >
      {children}
    </button>
  )
}

function CurrInput({ value, onChange, dimmed }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ color: C.t3, fontSize: 12, flexShrink: 0, userSelect: 'none' }}>$</span>
      <input
        type="number"
        style={{
          ...inputSx,
          fontFamily: 'monospace',
          color: dimmed ? C.t3 : C.t1,
        }}
        value={value || ''}
        onChange={e => onChange(parseNum(e.target.value))}
        placeholder="0"
        min="0"
      />
    </div>
  )
}

function PctInput({ value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <input
        type="number"
        style={{ ...inputSx, fontFamily: 'monospace', width: 88 }}
        value={value || ''}
        onChange={e => onChange(parseNum(e.target.value))}
        placeholder="0"
        min="0"
        max="100"
        step="0.1"
      />
      <span style={{ color: C.t3, fontSize: 12, flexShrink: 0, userSelect: 'none' }}>%</span>
    </div>
  )
}

// ── Activity Row ───────────────────────────────────────────────────────────────
function ActivityRow({ activity, onChange, onDelete }) {
  const isManual = activity.dollarOverride !== null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 94px 22px', gap: 6, alignItems: 'center', marginBottom: 6 }}>
      <input
        style={{ ...inputSx, fontSize: 12 }}
        value={activity.name}
        onChange={e => onChange('name', e.target.value)}
        placeholder="Activity name"
      />
      <input
        type="number"
        style={{ ...inputSx, fontSize: 12, textAlign: 'right', fontFamily: 'monospace' }}
        value={activity.hours || ''}
        onChange={e => onChange('hours', parseNum(e.target.value))}
        placeholder="0"
        min="0"
        title="Estimated hours"
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <span style={{ color: C.t3, fontSize: 11, flexShrink: 0 }}>$</span>
        <input
          type="number"
          style={{
            ...inputSx,
            fontSize: 12,
            textAlign: 'right',
            fontFamily: 'monospace',
            color: isManual ? C.amber : C.t3,
            borderColor: isManual ? C.amberB : C.border,
          }}
          value={activity.dollarOverride !== null ? activity.dollarOverride : ''}
          onChange={e => {
            const v = e.target.value
            onChange('dollarOverride', v === '' ? null : parseNum(v))
          }}
          placeholder="auto"
          title="Manual dollar override (leave blank to auto-calculate from hours × ratecard)"
        />
      </div>
      <DelBtn onClick={onDelete} />
    </div>
  )
}

// ── Comparison Table ───────────────────────────────────────────────────────────
function ComparisonTable({ results }) {
  const rows = [
    {
      key: 'totalCO',
      label: 'Total CO Value',
      textColor: () => C.amber,
      bg: () => C.amberBg,
      bold: false,
    },
    {
      key: 'newTotalBudget',
      label: 'New Total Budget',
      textColor: () => C.t1,
      bg: () => 'transparent',
      bold: true,
    },
    {
      key: 'newEAC',
      label: 'New EAC',
      textColor: () => C.t2,
      bg: () => 'transparent',
      bold: false,
    },
    {
      key: 'remainingVariance',
      label: 'Remaining Variance',
      textColor: v => v >= 0 ? C.green : C.red,
      bg: v => v >= 0 ? C.greenBg : C.redBg,
      bold: true,
    },
  ]

  return (
    <div style={{ background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ padding: '8px 14px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.t3, textAlign: 'left', borderBottom: `1px solid ${C.border}`, background: C.panel, width: 180 }}>
              Metric
            </th>
            {results.map(sr => (
              <th key={sr.id} style={{ padding: '8px 14px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: C.t2, textAlign: 'right', borderBottom: `1px solid ${C.border}`, background: C.panel, whiteSpace: 'nowrap' }}>
                {sr.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.key}>
              <td style={{ padding: '7px 14px', fontSize: 11, color: C.t2, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>
                {row.label}
              </td>
              {results.map(sr => {
                const v = sr[row.key]
                return (
                  <td key={sr.id} style={{
                    padding: '7px 14px',
                    fontFamily: 'monospace',
                    fontSize: 13,
                    fontWeight: row.bold ? 700 : 400,
                    color: row.textColor(v),
                    background: row.bg(v),
                    textAlign: 'right',
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                    {fmt$(v)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Scenario Card ──────────────────────────────────────────────────────────────
function ScenarioCard({
  scenario,
  activities,
  currentEAC,
  disclosedEstimate,
  getActivityValue,
  onUpdate,
  onToggle,
  onRemove,
}) {
  const { preCoB, rawCO, discountPct, totalCO, newTotalBudget, newEAC, remainingVariance, perceptionFlag } = scenario

  return (
    <div style={{
      flex: '1 1 280px',
      minWidth: 280,
      maxWidth: 340,
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 6,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Card Header */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <input
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: `1px solid ${C.border}`,
            color: C.t1,
            fontSize: 14,
            fontWeight: 700,
            padding: '2px 0',
            outline: 'none',
            width: '100%',
            fontFamily: 'inherit',
          }}
          value={scenario.name}
          onChange={e => onUpdate('name', e.target.value)}
        />
        <DelBtn onClick={onRemove} />
      </div>

      <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Budget Basis Toggle */}
        <div>
          <FieldLabel>Budget Basis</FieldLabel>
          <div style={{ display: 'flex' }}>
            {[
              { val: 'available', label: 'Available Labor' },
              { val: 'disclosed', label: 'Disclosed Est.' },
            ].map(({ val, label }, i) => {
              const active = scenario.budgetBasis === val
              return (
                <button
                  key={val}
                  onClick={() => onUpdate('budgetBasis', val)}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    background: active ? C.borderH : C.field,
                    color: active ? C.t1 : C.t3,
                    border: `1px solid ${active ? C.borderH : C.border}`,
                    borderRadius: i === 0 ? '3px 0 0 3px' : '0 3px 3px 0',
                    marginLeft: i === 1 ? -1 : 0,
                    whiteSpace: 'nowrap',
                    fontFamily: 'inherit',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <div style={{ fontSize: 10, color: C.t3, marginTop: 4, fontFamily: 'monospace' }}>
            Pre-CO Budget: {fmt$(preCoB)}
          </div>
        </div>

        {/* Ratecard Selector */}
        <div>
          <FieldLabel>Ratecard</FieldLabel>
          <select
            style={{ ...inputSx, fontSize: 12, cursor: 'pointer' }}
            value={scenario.ratecardId}
            onChange={e => onUpdate('ratecardId', e.target.value)}
          >
            {RATECARD_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {discountPct > 0 && (
            <div style={{ marginTop: 4, fontSize: 10, color: C.t3, fontFamily: 'monospace' }}>
              {discountPct}% CO discount · {fmt$(rawCO)} → <span style={{ color: C.amber }}>{fmt$(totalCO)}</span>
            </div>
          )}
        </div>

        {/* CO Activities Checklist */}
        <div style={{ flex: 1 }}>
          <FieldLabel>CO Activities</FieldLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {activities.length === 0 && (
              <div style={{ fontSize: 11, color: C.t3, padding: '8px 0', fontStyle: 'italic' }}>
                No activities defined yet.
              </div>
            )}
            {activities.map(act => {
              const checked = scenario.checkedIds.includes(act.id)
              const val = getActivityValue(act)
              const isManual = act.dollarOverride !== null
              return (
                <label
                  key={act.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 8px',
                    background: checked ? C.amberBg : C.field,
                    border: `1px solid ${checked ? C.amberB : C.border}`,
                    borderRadius: 3,
                    cursor: 'pointer',
                    gap: 8,
                    userSelect: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(act.id)}
                      style={{ cursor: 'pointer', accentColor: C.amber, flexShrink: 0, width: 12, height: 12 }}
                    />
                    <span style={{
                      fontSize: 11,
                      color: checked ? C.t1 : C.t2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.4,
                    }}>
                      {act.name || '(unnamed)'}
                    </span>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: checked ? 600 : 400, color: checked ? C.amber : C.t3 }}>
                      {fmt$(val)}
                    </span>
                    {isManual && (
                      <span style={{ display: 'block', fontSize: 9, color: C.amberDim, letterSpacing: '0.06em' }}>manual</span>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* Perception Flag */}
        {perceptionFlag && (
          <div style={{
            padding: '10px 12px',
            background: C.yellowBg,
            border: `1px solid ${C.yellowB}`,
            borderRadius: 4,
            fontSize: 11,
            color: C.yellow,
            lineHeight: 1.6,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
              <span>⚠</span>
              <span>Perception Flag</span>
            </div>
            <div>
              The new total budget (<span style={{ fontFamily: 'monospace' }}>{fmt$(newTotalBudget)}</span>) is still below the disclosed estimate (<span style={{ fontFamily: 'monospace' }}>{fmt$(disclosedEstimate)}</span>). This may appear to recapture a previously granted discount. Consider framing as a portfolio-level conversation or switching budget basis to <strong>Available Labor</strong>.
            </div>
          </div>
        )}

        {/* Scenario Output Summary */}
        <div style={{
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '7px 12px', fontSize: 9, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.t3, borderBottom: `1px solid ${C.border}` }}>
            Scenario Outputs
          </div>

          {/* Pre-CO Budget */}
          <OutputRow label="Pre-CO Budget" value={preCoB} color={C.t1} />

          {/* Total CO Value */}
          <OutputRow label="Total CO Value" value={totalCO} color={C.amber} bg={C.amberBg} />

          {/* New Total Budget */}
          <OutputRow label="New Total Budget" value={newTotalBudget} color={C.t1} bold />

          {/* Divider */}
          <div style={{ borderTop: `1px solid ${C.borderH}`, margin: '0' }} />

          {/* Pre-CO EAC */}
          <OutputRow label="Pre-CO EAC" value={currentEAC} color={C.t3} />

          {/* New EAC */}
          <OutputRow label="New EAC" value={newEAC} color={C.t2} />

          {/* Remaining Variance */}
          <OutputRow
            label="Remaining Variance"
            value={remainingVariance}
            color={remainingVariance >= 0 ? C.green : C.red}
            bg={remainingVariance >= 0 ? C.greenBg : C.redBg}
            bold
          />
        </div>
      </div>
    </div>
  )
}

function OutputRow({ label, value, color, bg, bold }) {
  return (
    <div style={{
      padding: '7px 12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: bg || 'transparent',
      borderTop: `1px solid ${C.border}`,
    }}>
      <span style={{ fontSize: 11, color: C.t2 }}>{label}</span>
      <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: bold ? 700 : 400, color }}>
        {fmt$(value)}
      </span>
    </div>
  )
}
