using DidaElev.Engine.Models;
using System;

namespace DidaElev.Engine.Core
{
    public class SimulationController
    {
        public ElevatorConfig Tick(ElevatorConfig config, double deltaTimeSec)
        {
            var state = config.Simulation;
            var perf = config.Performance;
            
            // TARGET POSITION (Example: Move to Floor 3)
            double targetFloor = 3; 
            double targetPos = 0;
            for(int i=0; i<targetFloor && i<perf.FloorHeightsMm.Count; i++) 
                targetPos += (perf.FloorHeightsMm[i] / 1000.0);

            double distance = targetPos - state.CurrentPosition;
            
            if (Math.Abs(distance) > 0.01)
            {
                // Simple motion profile (P-Control for now)
                double maxSpeed = config.Machine.Speed;
                double accel = perf.Acceleration;
                
                // Direction
                double dir = distance > 0 ? 1 : -1;
                
                // Acceleration phase
                state.CurrentVelocity += dir * accel * deltaTimeSec;
                
                // Limit speed
                if (Math.Abs(state.CurrentVelocity) > maxSpeed)
                    state.CurrentVelocity = dir * maxSpeed;
                
                // Deceleration (Simple check)
                double stopDist = (state.CurrentVelocity * state.CurrentVelocity) / (2 * accel);
                if (Math.Abs(distance) <= stopDist)
                    state.CurrentVelocity -= dir * accel * deltaTimeSec;

                state.CurrentPosition += state.CurrentVelocity * deltaTimeSec;
            }
            else
            {
                state.CurrentVelocity = 0;
                state.CurrentPosition = targetPos;
                state.DoorStatus = "Opening";
            }

            return config;
        }
    }
}
