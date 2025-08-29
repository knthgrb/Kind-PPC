"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { WorkItem, Day, AvailabilityItem } from "@/types/profile";
import {
  GET_MONTHS,
  GET_YEARS,
  GET_ALL_DAYS,
  GET_TIME_SLOTS,
} from "@/constants/profile";
import Card from "@/components/Card";
import Chip from "@/components/Chip";
import RedButton from "@/components/ui/RedButton";
import GhostButton from "@/components/ui/GhostButton";

export default function ProfileClient() {
  /* Work history */
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [editingWork, setEditingWork] = useState(false);
  const [workForm, setWorkForm] = useState<Omit<WorkItem, "id">>({
    jobTitle: "",
    company: "",
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
    description: "",
  });

  const months = useMemo(() => GET_MONTHS(), []);
  const years = useMemo(() => GET_YEARS(), []);

  const addWork = () => {
    if (!workForm.jobTitle.trim()) return;
    setWorkItems((prev) => [
      {
        id: crypto.randomUUID(),
        ...workForm,
        collapsed: true,
      },
      ...prev,
    ]);
    setWorkForm({
      jobTitle: "",
      company: "",
      startMonth: "",
      startYear: "",
      endMonth: "",
      endYear: "",
      description: "",
    });
    setEditingWork(false);
  };

  const removeWork = (id: string) =>
    setWorkItems((prev) => prev.filter((w) => w.id !== id));

  const toggleCollapse = (id: string) =>
    setWorkItems((prev) =>
      prev.map((w) => (w.id === id ? { ...w, collapsed: !w.collapsed } : w))
    );

  /* Skills */
  const [skills, setSkills] = useState<string[]>(["Cooking", "Cleaning"]);
  const [editingSkills, setEditingSkills] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    if (!skills.includes(s)) setSkills((prev) => [...prev, s]);
    setSkillInput("");
  };
  const removeSkill = (s: string) =>
    setSkills((prev) => prev.filter((x) => x !== s));

  /* Availability */
  const allDays: Day[] = useMemo(() => GET_ALL_DAYS(), []);
  const timeSlots = useMemo(() => GET_TIME_SLOTS(), []);
  const [editingAvail, setEditingAvail] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Day[]>([
    "Monday",
    "Friday",
    "Sunday",
  ]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>(["Evening"]);
  const toggleDay = (d: Day) =>
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  const toggleSlot = (s: string) =>
    setSelectedSlots((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  const [availItems, setAvailItems] = useState<AvailabilityItem[]>([
    { id: crypto.randomUUID(), days: selectedDays, slots: selectedSlots },
  ]);

  const addAvailability = () => {
    setAvailItems((prev) => [
      {
        id: crypto.randomUUID(),
        days: [...selectedDays],
        slots: [...selectedSlots],
      },
      ...prev,
    ]);
    setEditingAvail(false);
  };
  const removeAvailability = (id: string) =>
    setAvailItems((prev) => prev.filter((a) => a.id !== id));

  /* Location Preference */
  const [editingLoc, setEditingLoc] = useState(false);
  const [locs, setLocs] = useState<string[]>(["Manila", "Ilagan"]);
  const [locInput, setLocInput] = useState("");
  const addLoc = () => {
    const s = locInput.trim();
    if (!s) return;
    if (!locs.includes(s)) setLocs((prev) => [...prev, s]);
    setLocInput("");
  };
  const removeLoc = (l: string) =>
    setLocs((prev) => prev.filter((x) => x !== l));

  /* Job Preferences */
  const [editingJobs, setEditingJobs] = useState(false);
  const [prefs, setPrefs] = useState<string[]>([]);
  const [prefInput, setPrefInput] = useState("");
  const addPref = () => {
    const s = prefInput.trim();
    if (!s) return;
    if (!prefs.includes(s)) setPrefs((prev) => [...prev, s]);
    setPrefInput("");
  };
  const removePref = (p: string) =>
    setPrefs((prev) => prev.filter((x) => x !== p));

  /* Document Uploads */
  const [editingDocs, setEditingDocs] = useState(false);
  const [docs, setDocs] = useState<string[]>([
    "/profile/id_placeholder_one.png",
    "/profile/id_placeholder_two.png",
  ]);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const chooseFile = () => fileRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setDocs((prev) => [...prev, url]);
  };
  const removeDoc = (url: string) =>
    setDocs((prev) => prev.filter((d) => d !== url));

  return (
    <main className="min-h-screen px-4 md:px-6 py-6 flex items-start justify-center">
      {/* Outer bordered container */}
      <div className="w-full max-w-6xl border border-[#E5E7EB] rounded-[30px] p-6 md:p-5 bg-white grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column */}
        <div className="lg:col-span-7 space-y-4">
          {/* Personal Information */}
          <Card
            title="Personal Information"
            right={
              <button
                type="button"
                aria-label="Edit personal info"
                className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center"
              >
                ✎
              </button>
            }
          >
            <div className="flex items-start gap-4 mt-6 ml-5">
              <div className="relative w-[196px]">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-center">
                  <div className="text-[13px] font-semibold text-[#21C36D] leading-none">
                    90%
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute -inset-1 rounded-full ring-4 ring-[#21C36D]/30" />
                  <Image
                    src="/profile/profile_placeholder.png"
                    alt="Profile"
                    width={196}
                    height={196}
                    className="relative rounded-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xl sm:text-[1.417rem] font-semibold text-[#222222] mt-1">
                  Alwin Smith
                </div>
                <div className="text-sm sm:text-[1.006rem] text-[#667282] mt-1">
                  example@gmail.com
                </div>
                <div className="text-sm sm:text-[1.006rem] text-[#667282] mt-1">
                  +63 945 4856 456
                </div>
                <div className="text-sm sm:text-[1.006rem] text-[#667282] mt-1">
                  Blk 12 Lot 8 Mabuhay St, Brgy <br />
                  San Isidro, Quezon City, Metro Manila, Philippines
                </div>
              </div>
            </div>
          </Card>

          {/* Work History */}
          <Card
            title="Work History"
            right={
              <button
                type="button"
                aria-label="Add work"
                onClick={() => setEditingWork((v) => !v)}
                className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center"
              >
                +
              </button>
            }
          >
            {!editingWork ? (
              <>
                {workItems.length === 0 ? (
                  <div className="text-sm opacity-70">
                    No work experience has been added yet
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {workItems.map((w) => (
                      <li
                        key={w.id}
                        className="rounded-md bg-white p-3 border border-white"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{w.jobTitle}</div>
                          <div className="flex gap-2">
                            <button
                              className="text-sm underline"
                              onClick={() => toggleCollapse(w.id)}
                            >
                              {w.collapsed ? "Expand" : "Collapse"}
                            </button>
                            <button
                              className="text-sm underline"
                              onClick={() => removeWork(w.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        {!w.collapsed && (
                          <div className="mt-2 text-sm opacity-80">
                            <div>{w.company}</div>
                            <div>
                              {w.startMonth} {w.startYear} – {w.endMonth}{" "}
                              {w.endYear}
                            </div>
                            {w.description ? (
                              <div className="mt-1">{w.description}</div>
                            ) : null}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 profileSkills">Job Title</label>
                  <input
                    value={workForm.jobTitle}
                    onChange={(e) =>
                      setWorkForm((f) => ({ ...f, jobTitle: e.target.value }))
                    }
                    placeholder="Job Title"
                    className="w-full h-10 rounded-md border border-white bg-white px-3 outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 profileSkills">Company</label>
                  <input
                    value={workForm.company}
                    onChange={(e) =>
                      setWorkForm((f) => ({ ...f, company: e.target.value }))
                    }
                    placeholder="Company"
                    className="w-full h-10 rounded-md border border-white bg-white px-3 outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 profileSkills">Start Date</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select
                      value={workForm.startMonth}
                      onChange={(e) =>
                        setWorkForm((f) => ({
                          ...f,
                          startMonth: e.target.value,
                        }))
                      }
                      className="w-full h-10 rounded-md border border-white bg-white px-3 outline-none"
                    >
                      <option value="">Month</option>
                      {months.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      value={workForm.startYear}
                      onChange={(e) =>
                        setWorkForm((f) => ({
                          ...f,
                          startYear: e.target.value,
                        }))
                      }
                      className="w-full h-10 rounded-md border border-white bg-white px-3 outline-none"
                    >
                      <option value="">Year</option>
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 profileSkills">End Date</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select
                      value={workForm.endMonth}
                      onChange={(e) =>
                        setWorkForm((f) => ({ ...f, endMonth: e.target.value }))
                      }
                      className="w-full h-10 rounded-md border border-white bg-white px-3 outline-none"
                    >
                      <option value="">Month</option>
                      {months.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      value={workForm.endYear}
                      onChange={(e) =>
                        setWorkForm((f) => ({ ...f, endYear: e.target.value }))
                      }
                      className="w-full h-10 rounded-md border border-white bg-white px-3 outline-none"
                    >
                      <option value="">Year</option>
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 profileSkills">
                    Description
                  </label>
                  <textarea
                    value={workForm.description}
                    onChange={(e) =>
                      setWorkForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Type Here…."
                    className="w-full min-h-[120px] rounded-md border border-white bg-white px-3 py-2 outline-none resize-y"
                  />
                </div>

                <div className="flex gap-3">
                  <GhostButton onClick={() => setEditingWork(false)}>
                    Cancel
                  </GhostButton>
                  <RedButton onClick={addWork}>Add</RedButton>
                </div>
              </div>
            )}
          </Card>

          {/* Skills */}
          <Card
            title="Skills"
            right={
              <button
                type="button"
                aria-label="Add skill"
                onClick={() => setEditingSkills((v) => !v)}
                className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center"
              >
                +
              </button>
            }
          >
            {!editingSkills ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <Chip key={s} onRemove={() => removeSkill(s)}>
                    {s}
                  </Chip>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" ? (e.preventDefault(), addSkill()) : null
                  }
                  placeholder="Type Here"
                  className="w-full h-10 rounded-md border border-white bg-white px-3 outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <Chip key={s} onRemove={() => removeSkill(s)}>
                      {s}
                    </Chip>
                  ))}
                </div>
                <div className="flex gap-3">
                  <GhostButton onClick={() => setEditingSkills(false)}>
                    Cancel
                  </GhostButton>
                  <RedButton onClick={() => setEditingSkills(false)}>
                    Add
                  </RedButton>
                </div>
              </div>
            )}
          </Card>

          {/* Availability */}
          <Card
            title="Availability"
            right={
              <button
                type="button"
                aria-label="Edit availability"
                onClick={() => setEditingAvail((v) => !v)}
                className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center"
              >
                +
              </button>
            }
          >
            {!editingAvail ? (
              <div className="space-y-3">
                {availItems.map((a) => (
                  <div key={a.id} className="flex flex-wrap gap-2 items-center">
                    {a.days.map((d) => (
                      <Chip key={d}>{d}</Chip>
                    ))}
                    {a.slots.map((s) => (
                      <Chip key={s}>{s}</Chip>
                    ))}
                    <button
                      className="text-sm underline ml-2"
                      onClick={() => removeAvailability(a.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Days Available */}
                <input
                  disabled
                  placeholder="Days Available"
                  className="w-full h-10 rounded-md border border-white bg-white px-3 outline-none opacity-60"
                />
                <div className="flex flex-wrap gap-2">
                  {allDays.map((d) => {
                    const checked = selectedDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className={[
                          "h-9 rounded-md px-3 border flex items-center gap-2",
                          checked
                            ? "border-[#CC0000] bg-white"
                            : "border-white bg-white/70",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "inline-flex items-center justify-center w-5 h-5 rounded-[4px] border",
                            checked
                              ? "border-[#CC0000] bg-[#CC0000]"
                              : "border-[#667282] bg-[#EDEDED]",
                          ].join(" ")}
                        >
                          {checked ? (
                            <svg
                              className="w-3 h-3 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={3}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          ) : null}
                        </span>
                        <span>{d}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Time Slots */}
                <input
                  disabled
                  placeholder="Time Slots"
                  className="w-full h-10 rounded-md border border-white bg-white px-3 outline-none opacity-60"
                />
                <div className="flex flex-wrap gap-2">
                  {timeSlots.map((s) => {
                    const checked = selectedSlots.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSlot(s)}
                        className={[
                          "h-9 rounded-md px-3 border flex items-center gap-2",
                          checked
                            ? "border-[#CC0000] bg-white"
                            : "border-white bg-white/70",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "inline-flex items-center justify-center w-5 h-5 rounded-[4px] border",
                            checked
                              ? "border-[#CC0000] bg-[#CC0000]"
                              : "border-[#667282] bg-[#EDEDED]",
                          ].join(" ")}
                        >
                          {checked ? (
                            <svg
                              className="w-3 h-3 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={3}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          ) : null}
                        </span>
                        <span>{s}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <GhostButton onClick={() => setEditingAvail(false)}>
                    Cancel
                  </GhostButton>
                  <RedButton onClick={addAvailability}>Add</RedButton>
                </div>
              </div>
            )}
          </Card>

          {/* Location Preference */}
          <Card
            title="Location Preference"
            right={
              <button
                type="button"
                aria-label="Add location"
                onClick={() => setEditingLoc((v) => !v)}
                className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center"
              >
                +
              </button>
            }
          >
            {!editingLoc ? (
              <div className="flex flex-wrap gap-2">
                {locs.map((l) => (
                  <Chip key={l} onRemove={() => removeLoc(l)}>
                    {l}
                  </Chip>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  value={locInput}
                  onChange={(e) => setLocInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" ? (e.preventDefault(), addLoc()) : null
                  }
                  placeholder="Type Here"
                  className="w-full h-10 rounded-md border border-white bg-white px-3 outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  {locs.map((l) => (
                    <Chip key={l} onRemove={() => removeLoc(l)}>
                      {l}
                    </Chip>
                  ))}
                </div>
                <div className="flex gap-3">
                  <GhostButton onClick={() => setEditingLoc(false)}>
                    Cancel
                  </GhostButton>
                  <RedButton onClick={() => setEditingLoc(false)}>
                    Add
                  </RedButton>
                </div>
              </div>
            )}
          </Card>

          {/* Job Preferences */}
          <Card
            title="Job Preferences"
            right={
              <button
                type="button"
                aria-label="Add preference"
                onClick={() => setEditingJobs((v) => !v)}
                className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center"
              >
                +
              </button>
            }
          >
            {!editingJobs ? (
              <div className="flex flex-wrap gap-2">
                {prefs.map((p) => (
                  <Chip key={p} onRemove={() => removePref(p)}>
                    {p}
                  </Chip>
                ))}
                {prefs.length === 0 && (
                  <div className="text-sm opacity-70">
                    No job preference found
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  value={prefInput}
                  onChange={(e) => setPrefInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" ? (e.preventDefault(), addPref()) : null
                  }
                  placeholder="Type Here"
                  className="w-full h-10 rounded-md border border-white bg-white px-3 outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  {prefs.map((p) => (
                    <Chip key={p} onRemove={() => removePref(p)}>
                      {p}
                    </Chip>
                  ))}
                </div>
                <div className="flex gap-3">
                  <GhostButton onClick={() => setEditingJobs(false)}>
                    Cancel
                  </GhostButton>
                  <RedButton onClick={() => setEditingJobs(false)}>
                    Add
                  </RedButton>
                </div>
              </div>
            )}
          </Card>

          {/* Document Uploads */}
          <Card
            title="Document Uploads"
            right={
              <button
                type="button"
                aria-label="Add document"
                onClick={() => setEditingDocs((v) => !v)}
                className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center"
              >
                +
              </button>
            }
          >
            <div className="flex flex-wrap items-center gap-3">
              {docs.map((url) => (
                <div key={url} className="relative">
                  <Image
                    src={url}
                    alt="ID"
                    width={110}
                    height={72}
                    className="rounded-md border border-white object-cover"
                  />
                  <button
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-red-600 text-lg leading-none"
                    onClick={() => removeDoc(url)}
                    aria-label="Remove document"
                  >
                    •
                  </button>
                </div>
              ))}
            </div>

            {editingDocs && (
              <div className="mt-4 flex items-center gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="hidden"
                />
                <RedButton className="w-[140px]" onClick={chooseFile}>
                  Upload
                </RedButton>
              </div>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-5 space-y-4">
          {/* My Video */}
          <Card
            title="My Video"
            right={
              <button
                type="button"
                aria-label="Upload video"
                className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center"
              >
                ⟳
              </button>
            }
          >
            <div className="overflow-hidden rounded-xl border border-[#E5E7EB]">
              <Image
                src="/profile/video_image_placeholder.png"
                alt="Video placeholder"
                width={640}
                height={360}
                className="w-full h-auto object-cover"
              />
            </div>
          </Card>

          {/* Progress / Tips */}
          <Card>
            <h3 className="profileLabel mb-2">
              Update your profile for better job recommendations
            </h3>
            <div className="mt-2">
              <div className="text-sm opacity-80 mb-1">90% Complete</div>
              <div className="h-2 rounded-full bg-[#ECECEC] overflow-hidden">
                <div
                  className="h-2 bg-[#CC0000] rounded-full"
                  style={{ width: "90%" }}
                />
              </div>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              <li>❌ Work History</li>
              <li>❌ Personal Info</li>
              <li>✔️ Skills</li>
              <li>✔️ Profile Picture</li>
              <li>✔️ Availability</li>
              <li>✔️ Location Preference</li>
              <li>❌ Job Preferences</li>
              <li>✔️ Document Uploads</li>
            </ul>
          </Card>

          {/* Logout */}
          <Card>
            <div className="flex items-center justify-between">
              <span className="profileLabel">Logout</span>
              <button
                type="button"
                className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center"
                aria-label="Logout"
              >
                ↪
              </button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
