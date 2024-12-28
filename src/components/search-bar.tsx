import { Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function SearchBar() {
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="flex-1 flex items-center gap-2 bg-black/5 rounded-lg px-4 py-2">
        <Search className="w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search for products..."
          className="bg-transparent border-none focus:outline-none w-full"
        />
      </div>
      <Button className="bg-[#C5F82A] text-black hover:bg-[#B4E729]">
        Find
      </Button>
      <Select defaultValue="nottingham">
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select location" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="nottingham">Nottingham, UK</SelectItem>
          <SelectItem value="london">London, UK</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="all">
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="electronics">Electronics</SelectItem>
          <SelectItem value="clothing">Clothing</SelectItem>
          <SelectItem value="home">Home & Garden</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" className="gap-2">
        <span className="text-[#C5F82A]">♥</span> Save search
      </Button>
    </div>
  )
}

