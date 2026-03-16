'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { subscribeCosts, addCost, deleteCost, calculateCostSummary, getTripMembers } from '@/lib/tripService'
import type { Trip, TripCost, CostSummary, CostCategory } from '@/types/trip'

interface Props {
  trip: Trip
  currentUserId: string
  currentUserName: string
}

const CATEGORY_CONFIG: Record<CostCategory, { emoji: string; label: string }> = {
  flights:   { emoji: '✈️', label: 'Flights' },
  hotels:    { emoji: '🏨', label: 'Hotels' },
  transport: { emoji: '🚕', label: 'Transport' },
  food:      { emoji: '🍽', label: 'Food' },
  tickets:   { emoji: '🎫', label: 'Tickets' },
  other:     { emoji: '📦', label: 'Other' },
}

type View = 'costs' | 'balances' | 'add'

export default function CostSplitter({ trip, currentUserId, currentUserName }: Props) {
  const [view,     setView]     = useState<View>('costs')
  const [costs,    setCosts]    = useState<TripCost[]>([])
  const [summary,  setSummary]  = useState<CostSummary[]>([])
  const [members,  setMembers]  = useState<{ id: string; displayName: string }[]>([])
  const [loading,  setLoading]  = useState(false)

  // Add cost form
  const [title,        setTitle]        = useState('')
  const [amount,       setAmount]       = useState('')
  const [category,     setCategory]     = useState<CostCategory>('other')
  const [splitMethod,  setSplitMethod]  = useState<'equal' | 'custom'>('equal')
  const [splitWith,    setSplitWith]    = useState<string[]>([])
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({})

  useEffect(() => {
    const unsub = subscribeCosts(trip.id, async (newCosts) => {
      setCosts(newCosts)
      const s = await calculateCostSummary(trip.id)
      setSummary(s)
    })
    getTripMembers(trip.id).then(m => {
      setMembers(m)
      setSplitWith(m.map(x => x.id)) // default: split with everyone
    })
    return unsub
  }, [trip.id])

  const totalSpend = costs.reduce((s, c) => s + c.amount, 0)
  const myBalance  = summary.find(s => s.memberId === currentUserId)?.netBalance ?? 0

  const handleAddCost = async () => {
    if (!title || !amount) return
    setLoading(true)
    try {
      const customSplitsNum = splitMethod === 'custom'
        ? Object.fromEntries(Object.entries(customSplits).map(([k, v]) => [k, parseFloat(v) || 0]))
        : undefined

      await addCost(trip.id, {
        title,
        amount: parseFloat(amount),
        currency: trip.currency,
        category,
        paidBy: currentUserId,
        paidByName: currentUserName,
        splitMethod,
        splitBetween: splitWith,
        customSplits: customSplitsNum,
        date: new Date().toISOString().split('T')[0],
      })

      // Reset form
      setTitle(''); setAmount(''); setCategory('other'); setSplitMethod('equal')
      setCustomSplits({})
      setView('costs')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (n: number) => `${trip.currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-50 rounded-2xl p-3 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total Spent</p>
          <p className="text-sm font-bold text-gray-900 mt-1">{formatAmount(totalSpend)}</p>
        </div>
        <div className={`rounded-2xl p-3 text-center ${myBalance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">{myBalance >= 0 ? 'You\'re Owed' : 'You Owe'}</p>
          <p className={`text-sm font-bold mt-1 ${myBalance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            {formatAmount(Math.abs(myBalance))}
          </p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-3 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Expenses</p>
          <p className="text-sm font-bold text-gray-900 mt-1">{costs.length}</p>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-2">
        {(['costs', 'balances'] as View[]).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
              view === v ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {v === 'costs' ? '💸 Expenses' : '⚖️ Balances'}
          </button>
        ))}
        <button onClick={() => setView('add')}
          className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
            view === 'add' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          + Add
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Costs list */}
        {view === 'costs' && (
          <motion.div key="costs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {costs.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <p className="text-3xl mb-2">💸</p>
                <p className="text-sm">No expenses yet</p>
                <p className="text-xs mt-1">Add the first one!</p>
              </div>
            )}
            {costs.map(cost => (
              <div key={cost.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-lg flex-shrink-0">
                  {CATEGORY_CONFIG[cost.category]?.emoji ?? '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{cost.title}</p>
                  <p className="text-xs text-gray-400">
                    Paid by {cost.paidByName} · Split {cost.splitMethod} ({cost.splitBetween.length} people)
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">{formatAmount(cost.amount)}</p>
                  {cost.paidBy === currentUserId && (
                    <button onClick={() => deleteCost(trip.id, cost.id)}
                      className="text-[10px] text-red-400 hover:text-red-600 transition-colors">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Balances */}
        {view === 'balances' && (
          <motion.div key="balances" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Individual balances */}
            <div className="space-y-2">
              {summary.map(s => (
                <div key={s.memberId} className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {s.memberName}
                      {s.memberId === currentUserId && <span className="text-gray-400 font-normal"> (you)</span>}
                    </p>
                    <p className="text-xs text-gray-400">Paid {formatAmount(s.totalPaid)}</p>
                  </div>
                  <div className={`text-sm font-bold ${s.netBalance > 0.01 ? 'text-green-600' : s.netBalance < -0.01 ? 'text-red-500' : 'text-gray-400'}`}>
                    {s.netBalance > 0.01 ? `+${formatAmount(s.netBalance)}` : s.netBalance < -0.01 ? formatAmount(s.netBalance) : 'Settled'}
                  </div>
                </div>
              ))}
            </div>

            {/* Settlements */}
            {summary.flatMap(s => s.settlements).length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">How to Settle Up</p>
                {summary.flatMap(s => s.settlements)
                  .filter((settlement, i, arr) => arr.findIndex(x => x.from === settlement.from && x.to === settlement.to) === i)
                  .map((s, i) => (
                    <div key={i} className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-2">
                      <span className="text-sm font-semibold text-gray-900">{s.fromName}</span>
                      <span className="text-gray-400 text-xs flex-1 text-center">pays {formatAmount(s.amount)} to</span>
                      <span className="text-sm font-semibold text-gray-900">{s.toName}</span>
                    </div>
                  ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Add cost form */}
        {view === 'add' && (
          <motion.div key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <input
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
              placeholder="What was this for?"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                placeholder={`Amount (${trip.currency})`}
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
              <select
                className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                value={category}
                onChange={e => setCategory(e.target.value as CostCategory)}
              >
                {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </select>
            </div>

            {/* Split method */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Split method</p>
              <div className="flex gap-2">
                {(['equal', 'custom'] as const).map(m => (
                  <button key={m} onClick={() => setSplitMethod(m)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                      splitMethod === m ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {m === 'equal' ? '⚖️ Equal Split' : '✏️ Custom'}
                  </button>
                ))}
              </div>
            </div>

            {/* Who to split with */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Split between</p>
              <div className="flex flex-wrap gap-2">
                {members.map(m => (
                  <button key={m.id}
                    onClick={() => setSplitWith(prev =>
                      prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id]
                    )}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                      splitWith.includes(m.id) ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {m.id === currentUserId ? 'You' : m.displayName.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amounts */}
            {splitMethod === 'custom' && splitWith.map(uid => {
              const member = members.find(m => m.id === uid)
              return (
                <div key={uid} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 flex-1">{uid === currentUserId ? 'You' : member?.displayName}</span>
                  <input
                    type="number"
                    className="w-28 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none"
                    placeholder={trip.currency}
                    value={customSplits[uid] ?? ''}
                    onChange={e => setCustomSplits(prev => ({ ...prev, [uid]: e.target.value }))}
                  />
                </div>
              )
            })}

            <button onClick={handleAddCost} disabled={loading || !title || !amount}
              className="w-full py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}