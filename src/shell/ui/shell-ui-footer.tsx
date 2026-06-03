export function ShellUiFooter() {
  return (
    <footer className="flex justify-center border-t border-zinc-800 bg-[#07080c] p-2 text-zinc-500">
      <div className="text-xs">
        Generated with{' '}
        <a
          className="hover:underline dark:text-primary"
          href="https://github.com/create-seed/create-seed"
          rel="noreferrer"
          target="_blank"
        >
          create-seed
        </a>
      </div>
    </footer>
  )
}
