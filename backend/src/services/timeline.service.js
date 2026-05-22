export function buildTimeline({ vaccinations = [], checkups = [], milestones = [] }) {
  const vaccineEvents = vaccinations.map((item) => ({
    id: item.id,
    type: 'vaccination',
    title: item.vaccine_name,
    status: item.status,
    date: item.completed_date || item.scheduled_date || item.recommended_date,
    data: item,
  }));

  const checkupEvents = checkups.map((item) => ({
    id: item.id,
    type: 'checkup',
    title: item.checkup_type,
    status: item.status,
    date: item.completed_date || item.scheduled_date,
    data: item,
  }));

  const milestoneEvents = milestones.map((item) => ({
    id: item.id,
    type: 'milestone',
    title: item.title,
    status: item.status,
    date: item.achieved_date || item.expected_date,
    data: item,
  }));

  return [...vaccineEvents, ...checkupEvents, ...milestoneEvents]
    .filter((event) => event.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}
