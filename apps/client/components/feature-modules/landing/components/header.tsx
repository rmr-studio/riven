import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="w-full border-b border-[#37322f]/6 bg-[#f7f5f3]">
      <div className="mx-auto max-w-[1060px] px-4">
        <nav className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-8">
            <div className="text-lg font-semibold text-[#37322f]">Brillance</div>
            <div className="hidden items-center space-x-6 md:flex">
              <button className="text-sm font-medium text-[#37322f] hover:text-[#37322f]/80">
                Products
              </button>
              <button className="text-sm font-medium text-[#37322f] hover:text-[#37322f]/80">
                Pricing
              </button>
              <button className="text-sm font-medium text-[#37322f] hover:text-[#37322f]/80">
                Docs
              </button>
            </div>
          </div>
          <Button variant="ghost" className="text-[#37322f] hover:bg-[#37322f]/5">
            Log in
          </Button>
        </nav>
      </div>
    </header>
  );
}
