import unittest
from cosmeon.core.scoring import compute_severity, severity_label, severity_color

class TestScoringEngine(unittest.TestCase):
    def test_compute_severity_zeroes(self):
        """Test with all zeroes (no risk)."""
        score, bd = compute_severity(
            flood_km2=0.0,
            ndvi_km2=0.0,
            aoi_km2=100.0,
            sar_mean=0.0,
            ndvi_mean=0.0,
            exposed_pop=0
        )
        self.assertEqual(score, 0.0)
        self.assertEqual(bd["flood"], 0.0)
        self.assertEqual(bd["ndvi"], 0.0)
        self.assertEqual(bd["pop"], 0.0)
        self.assertEqual(bd["sar"], 0.0)
        self.assertEqual(bd["ndvi_s"], 0.0)

    def test_compute_severity_max(self):
        """Test with heavily extreme data to ensure caps at 100."""
        score, bd = compute_severity(
            flood_km2=100.0,    # 100% flood
            ndvi_km2=100.0,     # 100% veg damage
            aoi_km2=100.0,
            sar_mean=-10.0,     # Extreme drop (-6 is max 100%)
            ndvi_mean=-1.0,     # Extreme drop (-0.5 is max 100%)
            exposed_pop=1_000_000 # 1M exposed (max 500k is 100%)
        )
        self.assertEqual(score, 100.0)
        self.assertEqual(bd["flood"], 100.0)
        self.assertEqual(bd["ndvi"], 100.0)
        self.assertEqual(bd["pop"], 100.0)
        self.assertEqual(bd["sar"], 100.0)
        self.assertEqual(bd["ndvi_s"], 100.0)

    def test_severity_label_thresholds(self):
        self.assertEqual(severity_label(10), "MINIMAL")
        self.assertEqual(severity_label(25), "LOW")
        self.assertEqual(severity_label(45), "MODERATE")
        self.assertEqual(severity_label(65), "HIGH")
        self.assertEqual(severity_label(85), "CRITICAL")
        self.assertEqual(severity_label(100), "CRITICAL")

    def test_severity_color_thresholds(self):
        self.assertEqual(severity_color(10), "#22c55e") # MINIMAL
        self.assertEqual(severity_color(25), "#84cc16") # LOW
        self.assertEqual(severity_color(45), "#f59e0b") # MODERATE
        self.assertEqual(severity_color(65), "#f97316") # HIGH
        self.assertEqual(severity_color(85), "#ef4444") # CRITICAL

if __name__ == '__main__':
    unittest.main()
