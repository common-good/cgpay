<script lang="ts">
  type Props = { name: string; size?: number; class?: string }
  let { name, size = 20, class: cls = '' }: Props = $props()

  const paths: Record<string, string> = {
    bank: 'M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3',
    clock: 'M12 8v4l3 2M12 2a10 10 0 100 20 10 10 0 000-20z',
    clipboard: 'M9 5h6a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2zM9 5V3h6v2M9 11h6M9 15h4',
    chat: 'M7 8h10M7 12h7M21 12c0 4.97-4.03 9-9 9-1.34 0-2.61-.29-3.76-.82L3 21l1.18-4.74C3.43 15.16 3 13.63 3 12c0-4.97 4.03-9 9-9s9 4.03 9 9z',
    plus: 'M12 5v14M5 12h14',
    folder: 'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
    user: 'M12 11a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 1116 0',
    bell: 'M15 17h5l-1.5-1.5V11a6.5 6.5 0 10-13 0v4.5L4 17h5M9 17a3 3 0 006 0',
    check: 'M5 13l4 4L19 7',
    download: 'M12 3v12m0 0l-4-4m4 4l4-4M5 21h14',
    upload: 'M12 21V9m0 0L8 13m4-4l4 4M5 3h14',
    arrow: 'M5 12h14m0 0l-6-6m6 6l-6 6',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7zM12 9a3 3 0 100 6 3 3 0 000-6z',
    dots: 'M5 12h.01M12 12h.01M19 12h.01',
    search: 'M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z',
    calendar: 'M3 9h18M5 7h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2zM8 5v4M16 5v4',
    filter: 'M4 6h16M7 12h10M10 18h4',
    x: 'M6 6l12 12M6 18L18 6',
    shield: 'M12 3l8 3v6c0 4.97-3.4 9.3-8 10-4.6-.7-8-5.03-8-10V6l8-3z',
    help: 'M12 2a10 10 0 100 20 10 10 0 000-20zM9.5 9a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4M12 17h.01'
  }

  const d = $derived(paths[name] ?? '')
</script>

<svg
  class={cls}
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <path d={d} />
</svg>
