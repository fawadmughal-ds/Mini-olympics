import { Medal } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4 sm:flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
              <Medal className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm">Mini Olympics 2026</span>
          </div>
          <div className="text-sm text-slate-400 text-center sm:text-right space-y-0.5">
            <p>© 2026 FCIT Sports Society. All rights reserved.</p>
            <p>
              Developed by{' '}
              <span className="font-semibold text-blue-400">Fawad Mughal</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
