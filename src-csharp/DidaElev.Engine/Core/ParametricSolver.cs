using DidaElev.Engine.Models;
using System;

namespace DidaElev.Engine.Core
{
    public class EngineeringResult
    {
        // Dimensions
        public double TotalShaftHeight { get; set; }
        public double TotalTravel { get; set; }
        
        // Mechanical Loads
        public double CabWeight { get; set; }
        public double CounterweightMass { get; set; }
        public double RatedLoad { get; set; }
        
        // Traction & Power
        public double RequiredMotorPowerKw { get; set; }
        public double TractionRatio { get; set; } // T1 / T2
        public bool TractionSafetyValid { get; set; }
        
        // Dynamic Factors
        public double BufferStrokeCab { get; set; }
        public double BufferStrokeCw { get; set; }
        public double SafetyGearActivationSpeed { get; set; }
    }

    public class ParametricSolver
    {
        public EngineeringResult Solve(ElevatorConfig config)
        {
            var res = new EngineeringResult();

            // 1. DIMENSION CALCULATIONS
            double totalFloorHeight = 0;
            if (config.Performance.FloorHeightsMm != null && config.Performance.FloorHeightsMm.Count > 0)
            {
                foreach (var h in config.Performance.FloorHeightsMm) totalFloorHeight += (h / 1000.0);
            }
            else 
            {
                // Fallback to simple calculation
                totalFloorHeight = (config.Performance.Stops - 1) * 3.5; // Default 3.5m
            }

            res.TotalTravel = totalFloorHeight;
            res.TotalShaftHeight = totalFloorHeight + config.Hoistway.PitDepth + config.Hoistway.Overhead;

            // 2. MASS & BALANCING (JSON Formula: CW = Cabin + 45% Rated Load)
            res.RatedLoad = config.Cab.RatedLoadKg;
            res.CabWeight = (config.Cab.Width * config.Cab.Depth * 200) + 400; // Estimated 400kg base + 200kg/m2
            res.CounterweightMass = res.CabWeight + (res.RatedLoad * 0.45);

            // 3. MOTOR POWER (JSON Formula: P = (F * v) / η)
            // F = Unbalanced load (kg) * gravity
            double unbalancedKg = Math.Abs(res.CabWeight + res.RatedLoad - res.CounterweightMass);
            double gravity = 9.81;
            double velocity = config.Machine.Speed > 0 ? config.Machine.Speed : 1.0;
            double efficiency = config.Machine.Efficiency > 0 ? config.Machine.Efficiency : 0.8;

            res.RequiredMotorPowerKw = (unbalancedKg * gravity * velocity) / (efficiency * 1000.0);

            // 4. TRACTION RATIO (Simplified T1/T2)
            // T1 = Loaded Side, T2 = Empty Side
            double T1 = (res.CabWeight + res.RatedLoad) * gravity;
            double T2 = res.CounterweightMass * gravity;
            res.TractionRatio = Math.Max(T1, T2) / Math.Min(T1, T2);

            // EN 81-20: Simplified safety check (Ratio < 2.0 for standard traction)
            res.TractionSafetyValid = res.TractionRatio < 2.0;

            // 5. BUFFER STROKES
            // S = 0.0674 * v^2
            res.BufferStrokeCab = 0.0674 * Math.Pow(velocity, 2);
            res.BufferStrokeCw = res.BufferStrokeCab;

            res.SafetyGearActivationSpeed = velocity * 1.25 + 0.25;

            return res;
        }
    }
}
