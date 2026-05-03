import { useState } from "react";
import { motion } from "framer-motion";

type PlywoodType = "BWR" | "BWP" | "Marine" | "Commercial";

const pricePerSqFt: Record<PlywoodType, [number, number]> = {
  BWR: [55, 75],
  BWP: [70, 95],
  Marine: [85, 120],
  Commercial: [40, 60],
};

const SHEET_LENGTH = 8; // ft
const SHEET_WIDTH = 4; // ft
const SHEET_AREA = SHEET_LENGTH * SHEET_WIDTH;

const PlywoodCalculator = () => {
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [thickness, setThickness] = useState("18");
  const [type, setType] = useState<PlywoodType>("BWR");
  const [quantity, setQuantity] = useState("1");
  const [result, setResult] = useState<{
    area: number;
    sheets: number;
    costMin: number;
    costMax: number;
  } | null>(null);

  const calculate = () => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    const qty = parseInt(quantity) || 1;
    if (!l || !w) return;
    const area = l * w * qty;
    const sheets = Math.ceil(area / SHEET_AREA);
    const [min, max] = pricePerSqFt[type];
    setResult({ area, sheets, costMin: area * min, costMax: area * max });
  };

  return (
    <section id="calculator" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-accent font-medium tracking-widest uppercase text-sm mb-3">Free Tool</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
            Plywood Requirement Calculator
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Get a quick estimate of plywood sheets needed for your project.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-8 shadow-lg"
        >
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Length (ft)</label>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="e.g. 10"
                className="w-full px-4 py-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-accent outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Width (ft)</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="e.g. 8"
                className="w-full px-4 py-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-accent outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Plywood Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PlywoodType)}
                className="w-full px-4 py-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-accent outline-none"
              >
                <option value="BWR">BWR (Boiling Water Resistant)</option>
                <option value="BWP">BWP (Boiling Water Proof)</option>
                <option value="Marine">Marine Grade</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Thickness (mm)</label>
              <select
                value={thickness}
                onChange={(e) => setThickness(e.target.value)}
                className="w-full px-4 py-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-accent outline-none"
              >
                {[6, 9, 12, 16, 18, 25].map((t) => (
                  <option key={t} value={t}>{t} mm</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Number of Panels</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="w-full px-4 py-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-accent outline-none"
              />
            </div>
          </div>

          <button
            onClick={calculate}
            className="w-full bg-accent text-accent-foreground py-3 rounded-md font-semibold hover:bg-accent/90 transition-colors shadow-md uppercase tracking-wide text-sm"
          >
            Calculate Estimate
          </button>

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-secondary rounded-lg p-6 space-y-3"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Area</p>
                  <p className="text-xl font-heading font-bold text-foreground">{result.area.toFixed(1)} sq ft</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sheets Required (8×4 ft)</p>
                  <p className="text-xl font-heading font-bold text-foreground">{result.sheets}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Estimated Cost Range</p>
                  <p className="text-xl font-heading font-bold text-accent">
                    ₹{result.costMin.toLocaleString("en-IN")} – ₹{result.costMax.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                * Final pricing subject to current market rates. Contact us for an exact quote.
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default PlywoodCalculator;
