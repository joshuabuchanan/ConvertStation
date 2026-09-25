"use client";

import { CheckCircle2, Gauge, Layers3, Rocket } from "lucide-react";

const steps = [
  { icon: Layers3, title: "Load files", text: "Drop in supported media files and browse the wider format catalog." },
  { icon: Gauge, title: "Tune settings", text: "Set quality, target format, and queue priority in one view." },
  { icon: Rocket, title: "Convert & export", text: "Run the queue and download the final result instantly." },
];

export default function WorkflowPanel() {
  return (
    <section className="panel workflow-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">OPERATING FLOW</p>
          <h2>Three steps to the finished file</h2>
        </div>
      </div>

      <div className="workflow-steps">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <div className="workflow-step" key={title}>
            <div className="workflow-no">0{index + 1}</div>
            <div className="workflow-icon">
              <Icon size={18} />
            </div>
            <div>
              <strong>{title}</strong>
              <p>{text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="workflow-note">
        <CheckCircle2 size={16} />
        Browser-first processing keeps the flow lightweight and local to your workstation.
      </div>
    </section>
  );
}
