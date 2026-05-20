<script lang="ts">
  type IconName =
    | 'home'
    | 'dumbbell'
    | 'list'
    | 'chart'
    | 'settings'
    | 'plus'
    | 'close'
    | 'chevron-right'
    | 'chevron-down'
    | 'calendar'
    | 'flame'
    | 'trash'
    | 'edit'
    | 'check'
    | 'note'
    | 'shield'
    | 'crux';

  let {
    name,
    size = 24,
    strokeWidth = 2,
    class: className = ''
  }: {
    name: IconName;
    size?: number;
    strokeWidth?: number;
    class?: string;
  } = $props();

  const paths: Record<IconName, string> = {
    home: 'M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z',
    dumbbell:
      'M6.5 6.5l11 11 M21 21l-1-1 M3 3l1 1 M18 22l4-4 M2 6l4-4 M3 10l7-7 M14 21l7-7',
    list: 'M3 6h.01 M3 12h.01 M3 18h.01 M8 6h13 M8 12h13 M8 18h13',
    chart: 'M3 3v18h18 M7 14l4-4 4 4 6-6',
    settings:
      'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    plus: 'M12 5v14 M5 12h14',
    close: 'M18 6 6 18 M6 6l12 12',
    'chevron-right': 'm9 18 6-6-6-6',
    'chevron-down': 'm6 9 6 6 6-6',
    calendar: 'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    flame:
      'M8.5 14.5A2.5 2.5 0 0 0 11 17c1.74 0 3.41-.81 5-2 1-1 2-2 2-4 0-1.5-.5-2.5-1-3.5-.5-1-1-2-1-3 0-1-.5-1.5-1-1.5s-1 .5-1 1.5c0 1.5-.5 2-1 2.5-.5.5-1 1-1 2.5 0 1-.5 1.5-1 1.5s-1-.5-1-1.5c0-1-.5-1.5-1-1.5s-1 .5-1 1.5c-.5 1-1 2-1 3 0 1 .5 2 1 2.5z',
    trash:
      'M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6',
    edit:
      'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
    check: 'M20 6 9 17l-5-5',
    note: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    crux: 'M5 5l14 14 M19 5L5 19'
  };
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  class={className}
  aria-hidden="true"
>
  <path d={paths[name]} />
</svg>
