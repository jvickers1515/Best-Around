import { useState, useEffect } from "react";
import { Plus, X, ChevronRight, MapPin, Pencil } from "lucide-react";
import { supabase } from "./supabaseClient";

const ITEMS = [
  {
    id: "espresso-martini",
    name: "Espresso Martini",
    group: "cocktail",
    categories: [
      { name: "Coffee flavor & quality", max: 10, hint: "Real espresso pull, not a syrupy shortcut — should taste like actual coffee." },
      { name: "Balance (sweet / bitter / boozy)", max: 10, hint: "None of the three should dominate — too sweet, too bitter, or all alcohol are all misses." },
      { name: "Foam & crema", max: 10, hint: "A thick, lasting foam cap on top — not thin or gone in seconds." },
      { name: "Craft & atmosphere", max: 5, hint: "How it felt to be served — the bartender's care and the vibe around it." },
      { name: "Presentation", max: 5, hint: "Right glass, clean pour, coffee bean garnish if that's the style." },
      { name: "Temperature", max: 5, hint: "Properly cold from shaking, not lukewarm or watered down." },
      { name: "Value for price", max: 5, hint: "Worth what you paid, relative to the experience." },
    ],
  },
  {
    id: "dirty-martini",
    name: "Dirty Martini",
    group: "cocktail",
    categories: [
      { name: "Gin / vodka quality", max: 10, hint: "The base spirit — not rail liquor unless that's genuinely what you asked for." },
      { name: "Brine balance", max: 10, hint: "Dirty enough to taste it, not so much it's basically olive juice." },
      { name: "Temperature & dilution", max: 10, hint: "Ice-cold, properly shaken or stirred — not warm or over-diluted." },
      { name: "Olive & garnish", max: 5, hint: "Good olives, right amount, garnished with care." },
      { name: "Craft & atmosphere", max: 5, hint: "How it felt to be served — the bartender's care and the vibe around it." },
      { name: "Glass presentation", max: 5, hint: "Chilled glass, clean pour, no spillage." },
      { name: "Value for price", max: 5, hint: "Worth what you paid, relative to the experience." },
    ],
  },
  {
    id: "old-fashioned",
    name: "Old Fashioned",
    group: "cocktail",
    categories: [
      { name: "Whiskey quality", max: 10, hint: "The base spirit — appropriate quality for the price point." },
      { name: "Balance", max: 10, hint: "Sugar, bitters, and whiskey in harmony — not cloying, not just straight whiskey." },
      { name: "Ice quality & dilution", max: 10, hint: "A big cube or sphere that melts slowly, properly stirred — not too watery, not too boozy." },
      { name: "Craft & atmosphere", max: 5, hint: "How it felt to be served — the bartender's care and the vibe around it." },
      { name: "Garnish", max: 5, hint: "Orange peel properly expressed, cherry quality if used." },
      { name: "Glass presentation", max: 5, hint: "Right glass, clean build, no mess." },
      { name: "Value for price", max: 5, hint: "Worth what you paid, relative to the experience." },
    ],
  },
  {
    id: "burger",
    name: "Burger",
    group: "food",
    categories: [
      { name: "Griddle crust & sear", max: 10, hint: "That lacy, caramelized edge from the griddle — not just gray and steamed." },
      { name: "Patty seasoning", max: 10, hint: "Actually seasoned, not bland — flavor built into the meat itself." },
      { name: "Meltiness & mouthfeel", max: 10, hint: "Cheese fully melted in, patty at the right temp — not cold, dry, or rubbery." },
      { name: "Fries quality", max: 5, hint: "Crispy outside, not soggy or limp — a real side, not an afterthought." },
      { name: "Bun & toppings", max: 5, hint: "Bun holds up without overpowering; toppings fresh and well-chosen." },
      { name: "Burger integrity", max: 5, hint: "Holds together as a bite — doesn't fall apart or ooze everywhere." },
      { name: "Value for price", max: 5, hint: "Worth what you paid, relative to the experience." },
    ],
  },
  {
    id: "wings",
    name: "Wings",
    group: "food",
    categories: [
      { name: "Sauce flavor", max: 10, hint: "Actually tastes good — balanced heat, tang, and flavor, not just heat for heat's sake." },
      { name: "Skin crispness", max: 10, hint: "Crispy skin, not soggy or rubbery underneath the sauce." },
      { name: "Meat quality & size", max: 10, hint: "Real meat on the bone, decent size — not tiny or mostly bone." },
      { name: "Sauce-to-wing ratio", max: 5, hint: "Coated well — not drowning in sauce, not dry." },
      { name: "Heat level accuracy", max: 5, hint: "If you ordered \"hot,\" is it actually hot?" },
      { name: "Sides", max: 5, hint: "Celery, carrots, ranch or blue cheese — fresh and worth having." },
      { name: "Value for price", max: 5, hint: "Worth what you paid, relative to the experience." },
    ],
  },
  {
    id: "pizza",
    name: "Pizza",
    group: "food",
    categories: [
      { name: "Crust execution", max: 10, hint: "Right texture for its style — crisp if thin, good chew and rise if thick." },
      { name: "Cheese quality & melt", max: 10, hint: "Good cheese, properly melted — not greasy or rubbery." },
      { name: "Sauce flavor & balance", max: 10, hint: "Actually flavorful — not flat canned-tomato taste or overly sweet." },
      { name: "Crust-to-cheese/topping ratio", max: 5, hint: "Not bare, not drowning — cheese and toppings proportioned well." },
      { name: "Cheese/Topping Quality", max: 5, hint: "Fresh ingredients, not sparse or low-effort." },
      { name: "Slice-to-slice consistency", max: 5, hint: "Evenly cooked throughout — not soggy in the middle, not burnt at the edges." },
      { name: "Value for price", max: 5, hint: "Worth what you paid, relative to the experience." },
    ],
  },
];

const RATER_NAME_KEY = "best-around:rater-name";

function groupByVenue(entries, item) {
  const map = new Map();
  for (const e of entries) {
    const key = e.venue.trim().toLowerCase();
    if (!map.has(key)) map.set(key, { venue: e.venue.trim(), entries: [] });
    map.get(key).entries.push(e);
  }
  const list = Array.from(map.values()).map((v) => {
    const totals = v.entries.map((e) => e.scores.reduce((a, b) => a + b, 0));
    const avgTotal = totals.reduce((a, b) => a + b, 0) / totals.length;
    const catAverages = item.categories.map((c, idx) => {
      const vals = v.entries.map((e) => e.scores[idx] ?? 0);
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    });
    const rawEntries = [...v.entries].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { venue: v.venue, count: v.entries.length, avgTotal, catAverages, entries: rawEntries };
  });
  list.sort((a, b) => b.avgTotal - a.avgTotal);
  return list;
}

function ScoreBadge({ value, size = "normal" }) {
  const display = (value / 10).toFixed(1);
  return (
    <span className={`ba-score ba-score--${size}`}>
      {display}
      <span className="ba-score-out">/5</span>
    </span>
  );
}

function Slider({ category, value, onChange }) {
  return (
    <div className="ba-slider-row">
      <div className="ba-slider-head">
        <span className="ba-slider-name">{category.name}</span>
        <span className="ba-slider-value">
          {value}
          <span className="ba-slider-max">/{category.max}</span>
        </span>
      </div>
      {category.hint && <p className="ba-slider-hint">{category.hint}</p>}
      <input
        type="range"
        min={0}
        max={category.max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ba-slider"
        aria-label={category.name}
      />
    </div>
  );
}

function NameGate({ onSave, onCancel, initialValue, blocking }) {
  const [value, setValue] = useState(initialValue || "");
  const canSave = value.trim().length > 0;

  return (
    <div className="ba-sheet-backdrop" onClick={blocking ? undefined : onCancel}>
      <div className="ba-sheet ba-sheet--name" onClick={(e) => e.stopPropagation()}>
        <div className="ba-sheet-header">
          <div>
            <h2 className="ba-sheet-title">{blocking ? "Who's rating?" : "Change your name"}</h2>
            <p className="ba-sheet-sub">
              {blocking ? "Enter the name from your invite — it'll tag everything you rate." : "This updates how you show up on new ratings."}
            </p>
          </div>
          {!blocking && (
            <button className="ba-icon-btn" onClick={onCancel} aria-label="Close">
              <X size={20} />
            </button>
          )}
        </div>
        <div className="ba-sheet-body">
          <label className="ba-field">
            <span className="ba-field-label">Your name</span>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. Jeff V."
              className="ba-input"
              autoFocus
            />
          </label>
        </div>
        <div className="ba-sheet-footer ba-sheet-footer--end">
          <button className="ba-submit" disabled={!canSave} onClick={() => onSave(value.trim())}>
            {blocking ? "Start rating" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RatingForm({ item, onSubmit, onClose, submitting, error, raterName, editingEntry, onDelete, venueList }) {
  const [venue, setVenue] = useState(editingEntry ? editingEntry.venue : "");
  const [notes, setNotes] = useState(editingEntry ? editingEntry.notes : "");
  const [scores, setScores] = useState(editingEntry ? editingEntry.scores : item.categories.map(() => 0));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const total = scores.reduce((a, b) => a + b, 0);
  const canSubmit = venue.trim().length > 0;
  const displayRater = editingEntry ? editingEntry.rater : raterName;
  const trimmedVenue = venue.trim().toLowerCase();
  const suggestions = trimmedVenue
    ? venueList.filter((v) => v.toLowerCase().includes(trimmedVenue) && v.toLowerCase() !== trimmedVenue).slice(0, 5)
    : [];

  function updateScore(idx, val) {
    setScores((prev) => prev.map((v, i) => (i === idx ? val : v)));
  }

  function handleDeleteClick() {
    if (confirmDelete) {
      onDelete(editingEntry.id);
    } else {
      setConfirmDelete(true);
    }
  }

  return (
    <div className="ba-sheet-backdrop" onClick={onClose}>
      <div className="ba-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ba-sheet-header">
          <div>
            <h2 className="ba-sheet-title">{editingEntry ? `Edit your ${item.name} rating` : `Rate a ${item.name}`}</h2>
            <p className="ba-sheet-sub">
              {editingEntry ? "Update the score or notes below." : "Where'd you have it?"} · Rating as {displayRater}
            </p>
          </div>
          <button className="ba-icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="ba-sheet-body">
          <label className="ba-field ba-field--venue">
            <span className="ba-field-label">Venue</span>
            <input
              type="text"
              value={venue}
              onChange={(e) => {
                setVenue(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="e.g. Druthers"
              className="ba-input"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="ba-suggestions">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="ba-suggestion"
                    onMouseDown={() => {
                      setVenue(s);
                      setShowSuggestions(false);
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </label>

          <div className="ba-sliders">
            {item.categories.map((c, idx) => (
              <Slider key={c.name} category={c} value={scores[idx]} onChange={(v) => updateScore(idx, v)} />
            ))}
          </div>

          <label className="ba-field">
            <span className="ba-field-label">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Style, context, anything worth flagging"
              className="ba-textarea"
              rows={2}
            />
          </label>

          {error && <p className="ba-error">{error}</p>}
        </div>

        <div className="ba-sheet-footer">
          {editingEntry ? (
            <button className="ba-delete" onClick={handleDeleteClick} disabled={submitting}>
              {confirmDelete ? "Tap again to delete" : "Delete rating"}
            </button>
          ) : (
            <div className="ba-total">
              <span className="ba-total-label">Total</span>
              <ScoreBadge value={total} size="large" />
            </div>
          )}
          <button
            className="ba-submit"
            disabled={!canSubmit || submitting}
            onClick={() => onSubmit({ id: editingEntry ? editingEntry.id : undefined, venue, notes, scores })}
          >
            {submitting ? "Saving…" : editingEntry ? "Save changes" : "Save rating"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RenameVenueModal({ oldName, onSave, onCancel, submitting, error }) {
  const [value, setValue] = useState(oldName);
  const canSave = value.trim().length > 0 && value.trim() !== oldName;

  return (
    <div className="ba-sheet-backdrop" onClick={onCancel}>
      <div className="ba-sheet ba-sheet--name" onClick={(e) => e.stopPropagation()}>
        <div className="ba-sheet-header">
          <div>
            <h2 className="ba-sheet-title">Rename venue</h2>
            <p className="ba-sheet-sub">Updates every rating for "{oldName}" across all items.</p>
          </div>
          <button className="ba-icon-btn" onClick={onCancel} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="ba-sheet-body">
          <label className="ba-field">
            <span className="ba-field-label">Correct name</span>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="ba-input"
              autoFocus
            />
          </label>
          {error && <p className="ba-error">{error}</p>}
        </div>
        <div className="ba-sheet-footer ba-sheet-footer--end">
          <button className="ba-submit" disabled={!canSave || submitting} onClick={() => onSave(value.trim())}>
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function HomeCard({ item, top, onOpen }) {
  return (
    <button className="ba-home-card" onClick={onOpen}>
      <div className="ba-home-card-top">
        <span className="ba-home-card-name">{item.name}</span>
        {top && <ScoreBadge value={top.avgTotal} />}
      </div>
      {top ? (
        <p className="ba-home-card-venue">
          {top.venue}
          <span className="ba-home-card-count">
            {" "}
            · {top.count} {top.count === 1 ? "rating" : "ratings"}
          </span>
        </p>
      ) : (
        <p className="ba-home-card-empty">No ratings yet — be the first</p>
      )}
      <ChevronRight size={16} className="ba-home-card-chevron" />
    </button>
  );
}

function HomeOverview({ venuesByItem, onOpenItem }) {
  const cocktails = ITEMS.filter((i) => i.group === "cocktail");
  const bites = ITEMS.filter((i) => i.group === "food");

  return (
    <div className="ba-home">
      <div className="ba-tab-group">
        <p className="ba-group-label">Cocktails</p>
        <div className="ba-home-cards">
          {cocktails.map((item) => (
            <HomeCard key={item.id} item={item} top={(venuesByItem[item.id] || [])[0] || null} onOpen={() => onOpenItem(item.id)} />
          ))}
        </div>
      </div>
      <div className="ba-tab-group ba-tab-group--last">
        <p className="ba-group-label">Bites</p>
        <div className="ba-home-cards">
          {bites.map((item) => (
            <HomeCard key={item.id} item={item} top={(venuesByItem[item.id] || [])[0] || null} onOpen={() => onOpenItem(item.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function VenueRow({ rank, venue, item, expanded, onToggle, raterName, onEdit, onRename }) {
  const myName = raterName.trim().toLowerCase();
  return (
    <div className={`ba-venue ${expanded ? "ba-venue--open" : ""}`}>
      <button className="ba-venue-head" onClick={onToggle}>
        <span className={`ba-rank ${rank === 1 ? "ba-rank--first" : ""}`}>{rank}</span>
        <span className="ba-venue-name">{venue.venue}</span>
        <span className="ba-venue-count">
          {venue.count} {venue.count === 1 ? "rating" : "ratings"}
        </span>
        <ScoreBadge value={venue.avgTotal} />
        <ChevronRight size={16} className="ba-chevron" />
      </button>
      {expanded && (
        <div className="ba-venue-detail">
          <div className="ba-detail-header">
            <span className="ba-detail-venue-name">{venue.venue}</span>
            <button className="ba-rename-btn" onClick={() => onRename(venue.venue)}>
              <Pencil size={11} /> Rename
            </button>
          </div>
          {item.categories.map((c, idx) => (
            <div className="ba-detail-row" key={c.name}>
              <span className="ba-detail-name">{c.name}</span>
              <span className="ba-detail-bar-track">
                <span
                  className="ba-detail-bar-fill"
                  style={{ width: `${(venue.catAverages[idx] / c.max) * 100}%` }}
                />
              </span>
              <span className="ba-detail-value">{venue.catAverages[idx].toFixed(1)}</span>
            </div>
          ))}
          <div className="ba-entries">
            {venue.entries.map((e) => {
              const isMine = myName.length > 0 && e.rater.trim().toLowerCase() === myName;
              return (
                <div className="ba-entry" key={e.id}>
                  <div className="ba-entry-main">
                    <span className="ba-entry-rater">{e.rater || "Anonymous"}</span>
                    <ScoreBadge value={e.scores.reduce((a, b) => a + b, 0)} />
                    {isMine && (
                      <button className="ba-entry-edit" onClick={() => onEdit(e)} aria-label="Edit your rating">
                        <Pencil size={13} />
                      </button>
                    )}
                  </div>
                  {e.notes && <p className="ba-note">"{e.notes}"</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [activeId, setActiveId] = useState(ITEMS[0].id);
  const [dataByItem, setDataByItem] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [formTarget, setFormTarget] = useState(null);
  const [expandedVenue, setExpandedVenue] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [raterName, setRaterName] = useState("");
  const [nameLoaded, setNameLoaded] = useState(false);
  const [nameEditorOpen, setNameEditorOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameSubmitting, setRenameSubmitting] = useState(false);
  const [renameError, setRenameError] = useState(null);

  // Name lives in this browser's localStorage — it's a real standalone site now, so this works directly.
  useEffect(() => {
    const stored = window.localStorage.getItem(RATER_NAME_KEY);
    if (stored) setRaterName(stored);
    setNameLoaded(true);
  }, []);

  async function fetchAll() {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase.from("ratings").select("*").order("created_at", { ascending: true });
    if (error) {
      setLoadError("Couldn't load the leaderboard. Check your connection and try again.");
      setLoading(false);
      return;
    }
    const next = {};
    for (const item of ITEMS) next[item.id] = [];
    for (const row of data) {
      if (next[row.item_id]) {
        next[row.item_id].push({ ...row, scores: row.scores });
      }
    }
    setDataByItem(next);
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
  }, []);

  const activeItem = ITEMS.find((i) => i.id === activeId);
  const entries = dataByItem[activeId] || [];
  const venues = groupByVenue(entries, activeItem);

  const venuesByItem = {};
  for (const item of ITEMS) venuesByItem[item.id] = groupByVenue(dataByItem[item.id] || [], item);

  const venueList = Array.from(
    new Set(Object.values(dataByItem).flat().map((e) => e.venue.trim()))
  );

  function saveName(name) {
    setRaterName(name);
    setNameEditorOpen(false);
    window.localStorage.setItem(RATER_NAME_KEY, name);
  }

  function openForm() {
    setFormError(null);
    setFormTarget("new");
  }

  function openEdit(entry) {
    setFormError(null);
    setFormTarget(entry);
  }

  async function submitRating({ id, venue, notes, scores }) {
    setSubmitting(true);
    setFormError(null);
    const cleanVenue = venue.trim();
    const cleanNotes = notes.trim();

    if (id) {
      const { error } = await supabase
        .from("ratings")
        .update({ venue: cleanVenue, notes: cleanNotes, scores })
        .eq("id", id);
      if (error) {
        setSubmitting(false);
        setFormError("Couldn't save that rating. Check your connection and try again.");
        return;
      }
    } else {
      const { error } = await supabase.from("ratings").insert([
        {
          item_id: activeId,
          venue: cleanVenue,
          rater: raterName,
          scores,
          notes: cleanNotes,
        },
      ]);
      if (error) {
        setSubmitting(false);
        setFormError("Couldn't save that rating. Check your connection and try again.");
        return;
      }
    }
    await fetchAll();
    setSubmitting(false);
    setFormTarget(null);
  }

  async function deleteEntry(id) {
    setSubmitting(true);
    setFormError(null);
    const { error } = await supabase.from("ratings").delete().eq("id", id);
    if (error) {
      setSubmitting(false);
      setFormError("Couldn't delete that rating. Check your connection and try again.");
      return;
    }
    await fetchAll();
    setSubmitting(false);
    setFormTarget(null);
  }

  async function renameVenue(oldName, newName) {
    setRenameSubmitting(true);
    setRenameError(null);
    // Exact, case-insensitive match — ilike with no wildcard characters behaves as an
    // equality check, so this won't accidentally touch a differently-named venue.
    const { error } = await supabase.from("ratings").update({ venue: newName }).ilike("venue", oldName);
    if (error) {
      setRenameSubmitting(false);
      setRenameError("Couldn't rename that venue. Check your connection and try again.");
      return;
    }
    await fetchAll();
    setRenameSubmitting(false);
    setRenameTarget(null);
  }

  return (
    <div className="ba-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500&family=IBM+Plex+Mono:wght@500;600&family=Inter:wght@400;500;600&display=swap');

        .ba-root {
          --bg: #1B2A22;
          --bg-raised: #223629;
          --paper: #ECE3CC;
          --paper-dim: #DCD0AE;
          --ink: #241F1A;
          --ink-soft: #5B5646;
          --brass: #C79A3E;
          --brass-dim: #8A6A2A;
          --rust: #A6462F;
          --sage: #7C8F68;
          font-family: 'Inter', -apple-system, sans-serif;
          background: var(--bg);
          color: var(--paper);
          min-height: 100vh;
          padding: 20px 16px 100px;
          max-width: 480px;
          margin: 0 auto;
          box-sizing: border-box;
        }
        .ba-root * { box-sizing: border-box; }

        .ba-header { margin-bottom: 22px; }
        .ba-title-btn { background: none; border: none; padding: 0; cursor: pointer; text-align: left; }
        .ba-title {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-weight: 500;
          font-size: 34px;
          margin: 0;
          color: var(--paper);
          line-height: 1.05;
        }
        .ba-header-meta { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 6px; }
        .ba-subtitle {
          display: flex;
          align-items: center;
          gap: 5px;
          margin: 0;
          font-size: 13px;
          color: var(--sage);
        }
        .ba-identity {
          background: none;
          border: none;
          color: var(--brass);
          font-size: 12.5px;
          font-family: inherit;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
          text-decoration-color: transparent;
          transition: text-decoration-color 0.15s;
        }
        .ba-identity:hover { text-decoration-color: var(--brass); }
        .ba-back {
          background: none;
          border: none;
          color: var(--brass);
          font-size: 13.5px;
          font-family: inherit;
          cursor: pointer;
          padding: 0 0 14px;
        }

        .ba-tab-group { margin-bottom: 14px; }
        .ba-tab-group--last { margin-bottom: 20px; }
        .ba-group-label {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: 13px;
          color: var(--sage);
          margin: 0 0 7px 2px;
        }
        .ba-tabs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 6px;
          scrollbar-width: none;
        }
        .ba-tabs::-webkit-scrollbar { display: none; }
        .ba-tab {
          flex: 0 0 auto;
          padding: 8px 14px;
          border-radius: 20px;
          border: 1px solid var(--bg-raised);
          background: var(--bg-raised);
          color: var(--paper-dim);
          font-size: 14px;
          font-family: inherit;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .ba-tab--active {
          background: var(--brass);
          border-color: var(--brass);
          color: var(--ink);
          font-weight: 600;
        }

        .ba-home { display: flex; flex-direction: column; }
        .ba-home-cards { display: flex; flex-direction: column; gap: 10px; margin-bottom: 4px; }
        .ba-home-card {
          position: relative;
          width: 100%;
          background: var(--paper);
          border: none;
          border-radius: 10px;
          padding: 14px 34px 14px 14px;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
        }
        .ba-home-card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .ba-home-card-name { font-size: 15px; font-weight: 600; color: var(--ink); }
        .ba-home-card-venue { margin: 4px 0 0; font-size: 13px; color: var(--ink-soft); }
        .ba-home-card-count { color: var(--ink-soft); }
        .ba-home-card-empty { margin: 4px 0 0; font-size: 13px; color: var(--ink-soft); font-style: italic; }
        .ba-home-card-chevron {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--ink-soft);
        }

        .ba-empty {
          text-align: center;
          padding: 48px 20px;
          color: var(--sage);
        }
        .ba-empty-title {
          font-family: 'Fraunces', serif;
          font-size: 20px;
          color: var(--paper);
          margin: 0 0 6px;
        }
        .ba-empty-sub { font-size: 14px; margin: 0; }

        .ba-list { display: flex; flex-direction: column; gap: 10px; }

        .ba-venue {
          background: var(--paper);
          border-radius: 10px;
          overflow: hidden;
        }
        .ba-venue-head {
          width: 100%;
          display: grid;
          grid-template-columns: 24px 1fr auto auto 16px;
          align-items: center;
          gap: 10px;
          padding: 14px 12px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
        }
        .ba-rank {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          font-weight: 600;
          color: var(--ink-soft);
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--paper-dim);
        }
        .ba-rank--first {
          background: var(--brass);
          border-color: var(--brass);
          color: var(--ink);
        }
        .ba-venue-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--ink);
        }
        .ba-venue-count {
          font-size: 11px;
          color: var(--ink-soft);
          white-space: nowrap;
        }
        .ba-chevron {
          color: var(--ink-soft);
          transition: transform 0.15s;
        }
        .ba-venue--open .ba-chevron { transform: rotate(90deg); }

        .ba-score {
          font-family: 'IBM Plex Mono', monospace;
          font-weight: 600;
          font-size: 16px;
          color: var(--rust);
        }
        .ba-score--large { font-size: 24px; }
        .ba-score-out { font-size: 0.6em; color: var(--ink-soft); font-weight: 500; }

        .ba-venue-detail {
          padding: 4px 14px 16px;
          border-top: 1px solid var(--paper-dim);
        }
        .ba-detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 10px 0 4px;
        }
        .ba-detail-venue-name { font-size: 14px; font-weight: 600; color: var(--ink); }
        .ba-rename-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: var(--ink-soft);
          font-size: 11.5px;
          font-family: inherit;
          cursor: pointer;
          padding: 3px 4px;
        }
        .ba-detail-row {
          display: grid;
          grid-template-columns: 1fr 80px 28px;
          align-items: center;
          gap: 8px;
          padding: 7px 0;
        }
        .ba-detail-name { font-size: 12px; color: var(--ink-soft); }
        .ba-detail-bar-track {
          height: 5px;
          background: var(--paper-dim);
          border-radius: 3px;
          overflow: hidden;
        }
        .ba-detail-bar-fill {
          display: block;
          height: 100%;
          background: var(--sage);
          border-radius: 3px;
        }
        .ba-detail-value {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          color: var(--ink);
          text-align: right;
        }
        .ba-entries { margin-top: 4px; padding-top: 10px; border-top: 1px dashed var(--paper-dim); display: flex; flex-direction: column; gap: 10px; }
        .ba-entry { display: flex; flex-direction: column; gap: 3px; }
        .ba-entry-main { display: flex; align-items: center; gap: 8px; }
        .ba-entry-rater { font-size: 12.5px; font-weight: 600; color: var(--ink); flex: 1; }
        .ba-entry-edit {
          background: none;
          border: none;
          color: var(--ink-soft);
          cursor: pointer;
          padding: 3px;
        }
        .ba-note { margin: 0; font-size: 12.5px; color: var(--ink-soft); font-style: italic; }

        .ba-fab {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          width: min(448px, calc(100% - 32px));
          display: flex;
          justify-content: flex-end;
        }
        .ba-fab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--brass);
          color: var(--ink);
          border: none;
          border-radius: 24px;
          padding: 13px 20px;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(0,0,0,0.35);
        }

        .ba-sheet-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(10, 14, 11, 0.6);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 50;
        }
        .ba-sheet {
          background: var(--paper);
          width: 100%;
          max-width: 480px;
          max-height: 88vh;
          border-radius: 18px 18px 0 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .ba-sheet--name { max-height: none; }
        .ba-sheet-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 18px 18px 12px;
          border-bottom: 1px solid var(--paper-dim);
        }
        .ba-sheet-title {
          font-family: 'Fraunces', serif;
          font-size: 20px;
          margin: 0;
          color: var(--ink);
        }
        .ba-sheet-sub { margin: 3px 0 0; font-size: 13px; color: var(--ink-soft); }
        .ba-icon-btn {
          background: none;
          border: none;
          color: var(--ink-soft);
          cursor: pointer;
          padding: 4px;
        }
        .ba-sheet-body {
          padding: 16px 18px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .ba-field { display: flex; flex-direction: column; gap: 6px; }
        .ba-field--venue { position: relative; }
        .ba-field-label { font-size: 12.5px; color: var(--ink-soft); font-weight: 500; }
        .ba-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 4px;
          background: #fff;
          border: 1px solid var(--paper-dim);
          border-radius: 8px;
          overflow: hidden;
          z-index: 5;
          box-shadow: 0 6px 14px rgba(0,0,0,0.15);
        }
        .ba-suggestion {
          display: block;
          width: 100%;
          text-align: left;
          padding: 9px 12px;
          background: none;
          border: none;
          font-family: inherit;
          font-size: 14px;
          color: var(--ink);
          cursor: pointer;
        }
        .ba-suggestion:hover { background: var(--paper); }
        .ba-input, .ba-textarea {
          font-family: inherit;
          font-size: 15px;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid var(--paper-dim);
          background: #fff;
          color: var(--ink);
        }
        .ba-textarea { resize: none; }

        .ba-sliders { display: flex; flex-direction: column; gap: 14px; }
        .ba-slider-row { display: flex; flex-direction: column; gap: 5px; }
        .ba-slider-head { display: flex; justify-content: space-between; align-items: baseline; }
        .ba-slider-name { font-size: 13.5px; color: var(--ink); font-weight: 500; }
        .ba-slider-hint {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: 12px;
          color: var(--ink-soft);
          margin: -2px 0 2px;
          line-height: 1.35;
        }
        .ba-slider-value {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          color: var(--ink);
        }
        .ba-slider-max { color: var(--ink-soft); }
        .ba-slider {
          width: 100%;
          accent-color: var(--rust);
          height: 22px;
        }

        .ba-error {
          background: #F3D9D2;
          color: var(--rust);
          font-size: 13px;
          padding: 8px 10px;
          border-radius: 8px;
          margin: 0;
        }

        .ba-sheet-footer { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-top: 1px solid var(--paper-dim); background: var(--paper); }
        .ba-sheet-footer--end { justify-content: flex-end; }
        .ba-total { display: flex; flex-direction: column; }
        .ba-total-label { font-size: 11px; color: var(--ink-soft); }
        .ba-submit {
          background: var(--ink);
          color: var(--paper);
          border: none;
          border-radius: 22px;
          padding: 12px 22px;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
        }
        .ba-submit:disabled { opacity: 0.4; cursor: not-allowed; }
        .ba-delete {
          background: none;
          border: none;
          color: var(--rust);
          font-size: 13px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          padding: 8px 4px;
        }
        .ba-delete:disabled { opacity: 0.5; cursor: not-allowed; }

        .ba-loading { text-align: center; padding: 60px 0; color: var(--sage); font-size: 14px; }
      `}</style>

      <header className="ba-header">
        <button className="ba-title-btn" onClick={() => setView("home")}>
          <h1 className="ba-title">Best Around</h1>
        </button>
        <div className="ba-header-meta">
          <p className="ba-subtitle">
            <MapPin size={13} /> Saratoga Springs
          </p>
          {nameLoaded && raterName && (
            <button className="ba-identity" onClick={() => setNameEditorOpen(true)}>
              Rating as {raterName}
            </button>
          )}
        </div>
      </header>

      {loadError && <p className="ba-error" style={{ marginBottom: 16 }}>{loadError}</p>}

      {view === "home" ? (
        <HomeOverview
          venuesByItem={venuesByItem}
          onOpenItem={(id) => {
            setActiveId(id);
            setView("item");
            setExpandedVenue(null);
          }}
        />
      ) : (
        <>
          <button
            className="ba-back"
            onClick={() => {
              setView("home");
              setExpandedVenue(null);
            }}
          >
            ‹ All spots
          </button>

          <div className="ba-tab-group">
            <p className="ba-group-label">Cocktails</p>
            <nav className="ba-tabs">
              {ITEMS.filter((item) => item.group === "cocktail").map((item) => (
                <button
                  key={item.id}
                  className={`ba-tab ${item.id === activeId ? "ba-tab--active" : ""}`}
                  onClick={() => {
                    setActiveId(item.id);
                    setExpandedVenue(null);
                  }}
                >
                  {item.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="ba-tab-group ba-tab-group--last">
            <p className="ba-group-label">Bites</p>
            <nav className="ba-tabs">
              {ITEMS.filter((item) => item.group === "food").map((item) => (
                <button
                  key={item.id}
                  className={`ba-tab ${item.id === activeId ? "ba-tab--active" : ""}`}
                  onClick={() => {
                    setActiveId(item.id);
                    setExpandedVenue(null);
                  }}
                >
                  {item.name}
                </button>
              ))}
            </nav>
          </div>

          {loading ? (
            <div className="ba-loading">Loading the leaderboard…</div>
          ) : venues.length === 0 ? (
            <div className="ba-empty">
              <p className="ba-empty-title">No {activeItem.name.toLowerCase()} ratings yet</p>
              <p className="ba-empty-sub">Be the first to rate one around town.</p>
            </div>
          ) : (
            <div className="ba-list">
              {venues.map((v, i) => (
                <VenueRow
                  key={v.venue}
                  rank={i + 1}
                  venue={v}
                  item={activeItem}
                  expanded={expandedVenue === v.venue}
                  onToggle={() => setExpandedVenue(expandedVenue === v.venue ? null : v.venue)}
                  raterName={raterName}
                  onEdit={openEdit}
                  onRename={(name) => {
                    setRenameError(null);
                    setRenameTarget(name);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {view === "item" && (
        <div className="ba-fab">
          <button className="ba-fab-btn" onClick={openForm}>
            <Plus size={18} /> Rate a place
          </button>
        </div>
      )}

      {formTarget && (
        <RatingForm
          item={activeItem}
          onSubmit={submitRating}
          onClose={() => setFormTarget(null)}
          submitting={submitting}
          error={formError}
          raterName={raterName}
          editingEntry={formTarget === "new" ? null : formTarget}
          onDelete={deleteEntry}
          venueList={venueList}
        />
      )}

      {nameLoaded && !raterName && <NameGate blocking initialValue="" onSave={saveName} />}
      {nameEditorOpen && (
        <NameGate initialValue={raterName} onSave={saveName} onCancel={() => setNameEditorOpen(false)} />
      )}
      {renameTarget && (
        <RenameVenueModal
          oldName={renameTarget}
          onSave={(newName) => renameVenue(renameTarget, newName)}
          onCancel={() => setRenameTarget(null)}
          submitting={renameSubmitting}
          error={renameError}
        />
      )}
    </div>
  );
}
