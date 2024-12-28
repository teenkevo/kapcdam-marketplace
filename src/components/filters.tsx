"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { DualRangeSlider } from "./ui/dual-range-slider";

export default function Filters() {
  const [storiesPerDay, setStoriesPerDay] = useState("10-20");
  const [values, setValues] = useState([0, 500000]);

  const subjects = [
    { id: "home-accessories", label: "Home Accessories", checked: true },
    { id: "fashion", label: "Fashion", checked: true },
    { id: "health-and-wellness", label: "Health and Wellness", checked: false },
    { id: "jewellery", label: "Jewellery", checked: true },
    { id: "books", label: "Books", checked: false },
  ];

  return (
    <div className="w-full space-y-4 px-8 py-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-black">Filters</h1>

        <Settings2 className="h-5 w-5 text-black" />
      </div>

      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Categories</h2>
            <Button variant="secondary" className="text-sm font-normal h-8">
              Reset
            </Button>
          </div>
          <div className="space-y-3">
            {subjects.map(({ id, label, checked }) => (
              <div key={id} className="flex items-center space-x-2">
                <Checkbox id={id} defaultChecked={checked} />
                <Label htmlFor={id} className="text-sm">
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Product price</h2>
          <div>
            <DualRangeSlider
              className="mt-10"
              label={(value) => <span>{value} </span>}
              value={values}
              onValueChange={setValues}
              min={0}
              max={500000}
              step={100000}
            />
          </div>
        </CardContent>
      </Card>

      {/* <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Stories per day</h2>
          <RadioGroup value={storiesPerDay} onValueChange={setStoriesPerDay}>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="<10" id="lt10" />
                <Label htmlFor="lt10">{"<10"}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="10-20" id="10-20" />
                <Label htmlFor="10-20">10-20</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="20-30" id="20-30" />
                <Label htmlFor="20-30">20-30</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="30>" id="gt30" />
                <Label htmlFor="gt30">{"30>"}</Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card> */}
    </div>
  );
}
