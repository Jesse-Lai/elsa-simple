'use client';
// Editable React implementation of Figma Data Agent / 296:2784.
// Summary example readouts are preserved exactly as supplied in the design.
import { PromptSuggestion } from '@/components/prompt-kit/prompt-suggestion';
import { DesignVector } from './design-vector';
import { DesignReportSections, type DesignReportProps } from './design-report-sections';
import './design-report.css';

export function DesignAnalysisReport({onAsk, onEvidence, branch, data, onAction}: DesignReportProps) { return (<div className="content-stretch flex flex-col gap-[var(--spacing-24,24px)] items-start pb-[var(--spacing-24,24px)] pt-[var(--spacing-32,32px)] px-[var(--spacing-32,32px)] relative shrink-0 w-full max-w-[1152px] mx-auto design-report" data-node-id="189:5245" data-name="Analysis report">
        <div className="bg-[rgba(190,190,190,0.08)] border border-[var(--conclusion-border,#dce2ee)] border-solid content-stretch flex flex-col gap-[var(--spacing-24,24px)] items-start p-[var(--spacing-28,28px)] relative rounded-[var(--radius-16,16px)] shrink-0 w-full" data-node-id="189:6868" data-name="Conclusion">
    <div className="content-stretch flex flex-col gap-[var(--spacing-12,12px)] items-start p-[var(--spacing-0,0px)] relative w-full" data-node-id="296:2799" data-name="Conclusion header">
      <div className="content-stretch flex flex-col gap-[var(--spacing-20,20px)] items-start p-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="296:2800" data-name="Main takeaway">
        <div className="content-stretch flex items-center justify-between pr-[16px] relative shrink-0 w-full" data-node-id="296:2801">
          <div className="bg-[rgba(189,48,74,0.15)] content-stretch flex items-center justify-center px-[20px] py-[12px] relative rounded-[12px] shrink-0" data-node-id="296:2802">
            <p className="[word-break:break-word] font-semibold leading-[32px] not-italic relative shrink-0 text-[24px] text-[color:var(--attention,#bd304a)] whitespace-nowrap" data-node-id="296:2803">
              Don’t expand rollout
            </p>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-node-id="296:2804">
          <p className="[word-break:break-word] font-semibold leading-[32px] not-italic relative shrink-0 text-[24px] text-[color:var(--foreground,#09090b)] tracking-[-0.48px] w-full" data-node-id="296:2805">
            Bebop lifts ZQ engagement, but active usage falls as stop generation rises. The causal link and the Non-ZQ increase still need validation.
          </p>
          <div className="content-stretch flex flex-col gap-[var(--spacing-8,8px)] items-start min-w-[320px] pl-[var(--spacing-0,0px)] pr-[var(--spacing-16,16px)] py-[12px] relative shrink-0 w-full" data-node-id="296:2806" data-name="Key readout">
            <div className="content-stretch flex flex-col gap-[7px] items-start relative shrink-0 w-full" data-node-id="296:2807">
              <div className="[word-break:break-word] content-stretch flex font-normal items-center justify-between leading-[normal] not-italic relative shrink-0 text-[14px] text-[rgba(0,0,0,0.6)] w-full" data-node-id="296:2808">
                <p className="relative shrink-0 w-[100px]" data-node-id="296:2809">
                  SDFv2
                </p>
                <p className="relative shrink-0 text-center w-[100px]" data-node-id="296:2810">
                  MSIT
                </p>
                <p className="relative shrink-0 text-center w-[100px]" data-node-id="296:2811">
                  5%WW
                </p>
                <p className="relative shrink-0 text-center w-[100px]" data-node-id="296:2812">
                  0%WW
                </p>
                <p className="relative shrink-0 text-right w-[100px]" data-node-id="296:2813">
                  100%WW
                </p>
              </div>
              <div className="rollout-progress" data-node-id="296:2814" aria-hidden="true">
                <div className="rollout-progress-track" />
                <div className="rollout-progress-marker" />
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-normal items-center justify-between leading-[20px] not-italic relative shrink-0 text-[14px] text-[color:var(--muted-foreground,#71717a)] w-full" data-node-id="296:2818">
              <p className="relative shrink-0 w-[100px]" data-node-id="296:2819">
                Sep 1, 2026
              </p>
              <p className="relative shrink-0 text-center w-[100px]" data-node-id="296:2820">
                Sep 1, 2026
              </p>
              <p className="relative shrink-0 text-center w-[100px]" data-node-id="296:2821">
                Sep 14, 2026
              </p>
              <p className="opacity-0 relative shrink-0 w-[100px]" data-node-id="296:2822">
                Sep 14, 2026
              </p>
              <p className="opacity-0 relative shrink-0 text-right w-[100px]" data-node-id="296:2823">
                Sep 14, 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
          <div className="content-stretch flex flex-col gap-[var(--spacing-16,16px)] items-start p-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6890" data-name="Key experiment changes">
            <p className="font-semibold leading-[16px] relative shrink-0 text-[16px] text-[color:var(--foreground,#09090b)] w-full" data-node-id="189:6891">
              Positive signal
            </p>
            <div className="content-start flex flex-wrap gap-[var(--spacing-16,16px)] gap-y-[16px] items-start p-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6892" data-name="Metric cards">
              <div className="content-start flex flex-[1_0_0] flex-wrap gap-[var(--spacing-16,16px)] items-start min-w-[576px] p-[var(--spacing-0,0px)] relative" data-node-id="189:6893" data-name="Metric pair · 1">
                <div className="bg-[var(--background,white)] border border-[var(--border,#e4e4e7)] border-solid content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.08)] flex flex-[1_0_0] flex-col gap-[var(--spacing-12,12px)] items-start min-w-[280px] px-[var(--spacing-16,16px)] py-[var(--spacing-24,24px)] relative rounded-[var(--radius-14,14px)]" data-node-id="189:6894" data-name="Activation rate">
                  <div className="content-stretch flex gap-[var(--spacing-8,8px)] items-start p-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6895" data-name="Heading">
                    <p className="flex-[1_0_0] font-semibold leading-[20px] min-w-px relative text-[14px] text-[color:var(--foreground,#09090b)]" data-node-id="189:6896">
                      Activation rate
                    </p>
                  </div>
                  <div className="content-stretch flex flex-col gap-[var(--spacing-4,4px)] items-start p-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6897" data-name="Observed change">
                    <div className="content-center flex flex-wrap gap-[var(--spacing-12,4px_12px)] items-center min-h-[38px] p-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6898" data-name="Delta and assessment">
                      <p className="font-semibold leading-[38px] relative shrink-0 text-[32px] text-[color:var(--positive,#187b45)] tracking-[-1.28px] whitespace-nowrap" data-node-id="189:6899">
                        +2.7 pp
                      </p>
                      <div className="bg-[var(--positive-soft,#ddf6e8)] content-stretch flex gap-[var(--spacing-4,4px)] items-center px-[var(--spacing-8,8px)] py-[3px] relative rounded-[var(--radius-999,999px)] shrink-0" data-node-id="189:6900" data-name="ELSA / Status">
                        <p className="font-medium leading-[16px] relative shrink-0 text-[12px] text-[color:var(--positive,#187b45)] whitespace-nowrap" data-node-id="I189:6900;143:19">
                          Positive
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border-[var(--border,#e4e4e7)] border-solid border-t content-stretch flex flex-col gap-[var(--spacing-0,0px)] items-start pb-[var(--spacing-0,0px)] pt-[var(--spacing-12,12px)] px-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6901" data-name="Comparison">
                    <div className="content-stretch flex flex-col gap-[var(--spacing-0,0px)] h-[112px] items-start pb-[var(--spacing-2,2px)] pt-[var(--spacing-14,14px)] relative shrink-0 w-full" data-node-id="189:6902" data-name="ELSA / Comparison chart / Activation">
                      <div className="absolute content-stretch flex gap-[var(--spacing-0,0px)] h-[86px] items-start left-[64px] p-[var(--spacing-0,0px)] right-[54px] top-0" data-node-id="189:6903" data-name="Scale grid">
                        <div className="bg-[var(--border,#e4e4e7)] h-[86px] relative shrink-0 w-px" data-node-id="189:6904" data-name="Zero baseline" />
                      </div>
                      <div className="content-stretch flex gap-[var(--spacing-8,8px)] h-[16px] items-center pl-[var(--spacing-0,0px)] pr-[54px] py-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6906" data-name="Control">
                        <p className="font-normal leading-[14px] relative shrink-0 text-[10px] text-[color:var(--muted-foreground,#71717a)] w-[56px]" data-node-id="189:6907">
                          Control
                        </p>
                        <div className="content-stretch flex flex-[1_0_0] gap-[var(--spacing-0,0px)] h-[16px] items-start min-w-px p-[var(--spacing-0,0px)] relative" data-node-id="189:6908" data-name="Bar scale">
                          <div className="absolute content-stretch flex gap-[var(--spacing-0,0px)] h-[16px] items-start left-0 p-[var(--spacing-0,0px)] right-[19%] top-0" data-node-id="189:6909" data-name="Proportional bar · 0.810000">
                            <div className="flex-[1_0_0] h-[16px] min-w-px relative" data-node-id="189:6910" data-name="Value bar">
                              <DesignVector file="eda22" fit/>
                            </div>
                            <p className="absolute font-medium leading-[14px] right-[-8.71px] text-[10px] text-[color:var(--foreground,#09090b)] top-0 translate-x-full whitespace-nowrap" data-node-id="189:6911">
                              32.4%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="h-[26px] relative shrink-0 w-px" data-node-id="189:6912" data-name="Row gap" />
                      <div className="content-stretch flex gap-[var(--spacing-8,8px)] h-[16px] items-center pl-[var(--spacing-0,0px)] pr-[54px] py-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6913" data-name="Treatment">
                        <p className="font-normal leading-[14px] relative shrink-0 text-[10px] text-[color:var(--muted-foreground,#71717a)] w-[56px]" data-node-id="189:6914">
                          Treatment
                        </p>
                        <div className="content-stretch flex flex-[1_0_0] gap-[var(--spacing-0,0px)] h-[16px] items-start min-w-px p-[var(--spacing-0,0px)] relative" data-node-id="189:6915" data-name="Bar scale">
                          <div className="absolute content-stretch flex gap-[var(--spacing-0,0px)] h-[16px] items-start left-0 p-[var(--spacing-0,0px)] right-[12.25%] top-0" data-node-id="189:6916" data-name="Proportional bar · 0.877500">
                            <div className="flex-[1_0_0] h-[16px] min-w-px relative" data-node-id="189:6917" data-name="Value bar">
                              <DesignVector file="8c87b" fit/>
                            </div>
                            <p className="absolute font-medium leading-[14px] right-[-8.85px] text-[10px] text-[color:var(--foreground,#09090b)] top-0 translate-x-full whitespace-nowrap" data-node-id="189:6918">
                              35.1%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="h-[24px] relative shrink-0 w-px" data-node-id="189:6919" data-name="Axis gap" />
                      <div className="content-stretch flex font-normal gap-[var(--spacing-0,0px)] h-[14px] items-start justify-between leading-[14px] pl-[var(--spacing-64,64px)] pr-[54px] py-[var(--spacing-0,0px)] relative shrink-0 text-[10px] text-[color:var(--muted-foreground,#71717a)] w-full whitespace-nowrap" data-node-id="189:6920" data-name="Axis labels">
                        <p className="relative shrink-0" data-node-id="189:6921">
                          0%
                        </p>
                        <p className="relative shrink-0" data-node-id="189:6922">
                          40%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-[var(--background,white)] border border-[var(--border,#e4e4e7)] border-solid content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.08)] flex flex-[1_0_0] flex-col gap-[var(--spacing-12,12px)] items-start min-w-[280px] px-[var(--spacing-16,16px)] py-[var(--spacing-24,24px)] relative rounded-[var(--radius-14,14px)]" data-node-id="189:6923" data-name="Activation rate">
                  <div className="content-stretch flex gap-[var(--spacing-8,8px)] items-start p-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6924" data-name="Heading">
                    <p className="flex-[1_0_0] font-semibold leading-[20px] min-w-px relative text-[14px] text-[color:var(--foreground,#09090b)]" data-node-id="189:6925">
                      Activation rate
                    </p>
                  </div>
                  <div className="content-stretch flex flex-col gap-[var(--spacing-4,4px)] items-start p-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6926" data-name="Observed change">
                    <div className="content-center flex flex-wrap gap-[var(--spacing-12,4px_12px)] items-center min-h-[38px] p-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6927" data-name="Delta and assessment">
                      <p className="font-semibold leading-[38px] relative shrink-0 text-[32px] text-[color:var(--positive,#187b45)] tracking-[-1.28px] whitespace-nowrap" data-node-id="189:6928">
                        +2.7 pp
                      </p>
                      <div className="bg-[var(--positive-soft,#ddf6e8)] content-stretch flex gap-[var(--spacing-4,4px)] items-center px-[var(--spacing-8,8px)] py-[3px] relative rounded-[var(--radius-999,999px)] shrink-0" data-node-id="189:6929" data-name="ELSA / Status">
                        <p className="font-medium leading-[16px] relative shrink-0 text-[12px] text-[color:var(--positive,#187b45)] whitespace-nowrap" data-node-id="I189:6929;143:19">
                          Positive
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border-[var(--border,#e4e4e7)] border-solid border-t content-stretch flex flex-col gap-[var(--spacing-0,0px)] items-start pb-[var(--spacing-0,0px)] pt-[var(--spacing-12,12px)] px-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6930" data-name="Comparison">
                    <div className="content-stretch flex flex-col gap-[var(--spacing-0,0px)] h-[112px] items-start pb-[var(--spacing-2,2px)] pt-[var(--spacing-14,14px)] relative shrink-0 w-full" data-node-id="189:6931" data-name="ELSA / Comparison chart / Activation">
                      <div className="absolute content-stretch flex gap-[var(--spacing-0,0px)] h-[86px] items-start left-[64px] p-[var(--spacing-0,0px)] right-[54px] top-0" data-node-id="189:6932" data-name="Scale grid">
                        <div className="bg-[var(--border,#e4e4e7)] h-[86px] relative shrink-0 w-px" data-node-id="189:6933" data-name="Zero baseline" />
                      </div>
                      <div className="content-stretch flex gap-[var(--spacing-8,8px)] h-[16px] items-center pl-[var(--spacing-0,0px)] pr-[54px] py-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6935" data-name="Control">
                        <p className="font-normal leading-[14px] relative shrink-0 text-[10px] text-[color:var(--muted-foreground,#71717a)] w-[56px]" data-node-id="189:6936">
                          Control
                        </p>
                        <div className="content-stretch flex flex-[1_0_0] gap-[var(--spacing-0,0px)] h-[16px] items-start min-w-px p-[var(--spacing-0,0px)] relative" data-node-id="189:6937" data-name="Bar scale">
                          <div className="absolute content-stretch flex gap-[var(--spacing-0,0px)] h-[16px] items-start left-0 p-[var(--spacing-0,0px)] right-[19%] top-0" data-node-id="189:6938" data-name="Proportional bar · 0.810000">
                            <div className="flex-[1_0_0] h-[16px] min-w-px relative" data-node-id="189:6939" data-name="Value bar">
                              <DesignVector file="eda22" fit/>
                            </div>
                            <p className="absolute font-medium leading-[14px] right-[-8.71px] text-[10px] text-[color:var(--foreground,#09090b)] top-0 translate-x-full whitespace-nowrap" data-node-id="189:6940">
                              32.4%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="h-[26px] relative shrink-0 w-px" data-node-id="189:6941" data-name="Row gap" />
                      <div className="content-stretch flex gap-[var(--spacing-8,8px)] h-[16px] items-center pl-[var(--spacing-0,0px)] pr-[54px] py-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6942" data-name="Treatment">
                        <p className="font-normal leading-[14px] relative shrink-0 text-[10px] text-[color:var(--muted-foreground,#71717a)] w-[56px]" data-node-id="189:6943">
                          Treatment
                        </p>
                        <div className="content-stretch flex flex-[1_0_0] gap-[var(--spacing-0,0px)] h-[16px] items-start min-w-px p-[var(--spacing-0,0px)] relative" data-node-id="189:6944" data-name="Bar scale">
                          <div className="absolute content-stretch flex gap-[var(--spacing-0,0px)] h-[16px] items-start left-0 p-[var(--spacing-0,0px)] right-[12.25%] top-0" data-node-id="189:6945" data-name="Proportional bar · 0.877500">
                            <div className="flex-[1_0_0] h-[16px] min-w-px relative" data-node-id="189:6946" data-name="Value bar">
                              <DesignVector file="8c87b" fit/>
                            </div>
                            <p className="absolute font-medium leading-[14px] right-[-8.85px] text-[10px] text-[color:var(--foreground,#09090b)] top-0 translate-x-full whitespace-nowrap" data-node-id="189:6947">
                              35.1%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="h-[24px] relative shrink-0 w-px" data-node-id="189:6948" data-name="Axis gap" />
                      <div className="content-stretch flex font-normal gap-[var(--spacing-0,0px)] h-[14px] items-start justify-between leading-[14px] pl-[var(--spacing-64,64px)] pr-[54px] py-[var(--spacing-0,0px)] relative shrink-0 text-[10px] text-[color:var(--muted-foreground,#71717a)] w-full whitespace-nowrap" data-node-id="189:6949" data-name="Axis labels">
                        <p className="relative shrink-0" data-node-id="189:6950">
                          0%
                        </p>
                        <p className="relative shrink-0" data-node-id="189:6951">
                          40%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[var(--spacing-16,16px)] items-start p-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6952" data-name="Key experiment changes">
            <p className="font-semibold leading-[16px] relative shrink-0 text-[16px] text-[color:var(--foreground,#09090b)] whitespace-nowrap" data-node-id="189:6953">
              Needs attention
            </p>
            <div className="content-start flex flex-wrap gap-[var(--spacing-16,16px)] gap-y-[16px] items-start p-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6954" data-name="Metric cards">
              <div className="content-start flex flex-[1_0_0] flex-wrap gap-[var(--spacing-16,16px)] items-start min-w-[576px] p-[var(--spacing-0,0px)] relative" data-node-id="189:6955" data-name="Metric pair · 2">
                <div className="bg-[var(--background,white)] border border-[var(--border,#e4e4e7)] border-solid content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.08)] flex flex-[1_0_0] flex-col gap-[var(--spacing-12,12px)] items-start min-w-[280px] px-[var(--spacing-16,16px)] py-[var(--spacing-24,24px)] relative rounded-[var(--radius-14,14px)]" data-node-id="189:6956" data-name="Crash rate">
                  <div className="content-stretch flex gap-[var(--spacing-8,8px)] items-start p-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6957" data-name="Heading">
                    <p className="flex-[1_0_0] font-semibold leading-[20px] min-w-px relative text-[14px] text-[color:var(--foreground,#09090b)]" data-node-id="189:6958">
                      Onboarding latency
                    </p>
                  </div>
                  <div className="content-stretch flex flex-col gap-[var(--spacing-4,4px)] items-start p-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6959" data-name="Observed change">
                    <div className="content-center flex flex-wrap gap-[var(--spacing-12,4px_12px)] items-center min-h-[38px] p-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6960" data-name="Delta and assessment">
                      <p className="font-semibold leading-[38px] relative shrink-0 text-[32px] text-[color:var(--adverse,#bd4916)] tracking-[-1.28px] whitespace-nowrap" data-node-id="189:6961">
                        +64 ms
                      </p>
                      <div className="bg-[var(--caution-soft,#fff0e1)] content-stretch flex gap-[var(--spacing-4,4px)] items-center px-[var(--spacing-8,8px)] py-[3px] relative rounded-[var(--radius-999,999px)] shrink-0" data-node-id="189:6962" data-name="ELSA / Status">
                        <p className="font-medium leading-[16px] relative shrink-0 text-[12px] text-[color:var(--caution,#995414)] whitespace-nowrap" data-node-id="I189:6962;143:28">
                          Negative
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border-[var(--border,#e4e4e7)] border-solid border-t content-stretch flex flex-col gap-[var(--spacing-0,0px)] items-start pb-[var(--spacing-0,0px)] pt-[var(--spacing-12,12px)] px-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6963" data-name="Comparison">
                    <div className="content-stretch flex flex-col gap-[var(--spacing-0,0px)] h-[112px] items-start pb-[var(--spacing-2,2px)] pt-[var(--spacing-14,14px)] relative shrink-0 w-full" data-node-id="189:6964" data-name="ELSA / Comparison chart / Crash rate">
                      <div className="absolute content-stretch flex gap-[var(--spacing-0,0px)] h-[86px] items-start left-[64px] p-[var(--spacing-0,0px)] right-[53.67px] top-0" data-node-id="189:6965" data-name="Scale grid">
                        <div className="bg-[var(--border,#e4e4e7)] h-[86px] relative shrink-0 w-px" data-node-id="189:6966" data-name="Zero baseline" />
                      </div>
                      <div className="content-stretch flex gap-[var(--spacing-8,8px)] h-[16px] items-center pl-[var(--spacing-0,0px)] pr-[54px] py-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6968" data-name="Control">
                        <p className="font-normal leading-[14px] relative shrink-0 text-[10px] text-[color:var(--muted-foreground,#71717a)] w-[56px]" data-node-id="189:6969">
                          Control
                        </p>
                        <div className="content-stretch flex flex-[1_0_0] gap-[var(--spacing-0,0px)] h-[16px] items-start min-w-px p-[var(--spacing-0,0px)] relative" data-node-id="189:6970" data-name="Bar scale">
                          <div className="absolute content-stretch flex gap-[var(--spacing-0,0px)] h-[16px] items-start left-0 p-[var(--spacing-0,0px)] right-[6.67%] top-0" data-node-id="189:6971" data-name="Proportional bar · 0.933333">
                            <div className="flex-[1_0_0] h-[16px] min-w-px relative" data-node-id="189:6972" data-name="Value bar">
                              <DesignVector file="4017e" fit/>
                            </div>
                            <p className="absolute font-medium leading-[14px] right-[-8.64px] text-[10px] text-[color:var(--foreground,#09090b)] top-0 translate-x-full whitespace-nowrap" data-node-id="189:6973">
                              0.42%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="h-[26px] relative shrink-0 w-px" data-node-id="189:6974" data-name="Row gap" />
                      <div className="content-stretch flex gap-[var(--spacing-8,8px)] h-[16px] items-center pl-[var(--spacing-0,0px)] pr-[54px] py-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6975" data-name="Treatment">
                        <p className="font-normal leading-[14px] relative shrink-0 text-[10px] text-[color:var(--muted-foreground,#71717a)] w-[56px]" data-node-id="189:6976">
                          Treatment
                        </p>
                        <div className="content-stretch flex flex-[1_0_0] gap-[var(--spacing-0,0px)] h-[16px] items-start min-w-px p-[var(--spacing-0,0px)] relative" data-node-id="189:6977" data-name="Bar scale">
                          <div className="absolute content-stretch flex gap-[var(--spacing-0,0px)] h-[16px] items-start left-0 p-[var(--spacing-0,0px)] right-[4.44%] top-0" data-node-id="189:6978" data-name="Proportional bar · 0.955556">
                            <div className="flex-[1_0_0] h-[16px] min-w-px relative" data-node-id="189:6979" data-name="Value bar">
                              <DesignVector file="2a6fc" fit/>
                            </div>
                            <p className="absolute font-medium leading-[14px] right-[-8.54px] text-[10px] text-[color:var(--foreground,#09090b)] top-0 translate-x-full whitespace-nowrap" data-node-id="189:6980">
                              0.43%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="h-[24px] relative shrink-0 w-px" data-node-id="189:6981" data-name="Axis gap" />
                      <div className="content-stretch flex font-normal gap-[var(--spacing-0,0px)] h-[14px] items-start justify-between leading-[14px] pl-[var(--spacing-64,64px)] pr-[54px] py-[var(--spacing-0,0px)] relative shrink-0 text-[10px] text-[color:var(--muted-foreground,#71717a)] w-full whitespace-nowrap" data-node-id="189:6982" data-name="Axis labels">
                        <p className="relative shrink-0" data-node-id="189:6983">
                          0%
                        </p>
                        <p className="relative shrink-0" data-node-id="189:6984">
                          0.45%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-[var(--background,white)] border border-[var(--border,#e4e4e7)] border-solid content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.08)] flex flex-[1_0_0] flex-col gap-[var(--spacing-12,12px)] items-start min-w-[280px] px-[var(--spacing-16,16px)] py-[var(--spacing-24,24px)] relative rounded-[var(--radius-14,14px)]" data-node-id="189:6985" data-name="Crash rate">
                  <div className="content-stretch flex gap-[var(--spacing-8,8px)] items-start p-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6986" data-name="Heading">
                    <p className="flex-[1_0_0] font-semibold leading-[20px] min-w-px relative text-[14px] text-[color:var(--foreground,#09090b)]" data-node-id="189:6987">
                      Cancellation rate
                    </p>
                  </div>
                  <div className="content-stretch flex flex-col gap-[var(--spacing-4,4px)] items-start p-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6988" data-name="Observed change">
                    <div className="content-center flex flex-wrap gap-[var(--spacing-12,4px_12px)] items-center min-h-[38px] p-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6989" data-name="Delta and assessment">
                      <p className="font-semibold leading-[38px] relative shrink-0 text-[32px] text-[color:var(--adverse,#bd4916)] tracking-[-1.28px] whitespace-nowrap" data-node-id="189:6990">
                        +0.01 pp
                      </p>
                      <div className="bg-[var(--caution-soft,#fff0e1)] content-stretch flex gap-[var(--spacing-4,4px)] items-center px-[var(--spacing-8,8px)] py-[3px] relative rounded-[var(--radius-999,999px)] shrink-0" data-node-id="189:6991" data-name="ELSA / Status">
                        <p className="font-medium leading-[16px] relative shrink-0 text-[12px] text-[color:var(--caution,#995414)] whitespace-nowrap" data-node-id="I189:6991;143:28">
                          Negative
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border-[var(--border,#e4e4e7)] border-solid border-t content-stretch flex flex-col gap-[var(--spacing-0,0px)] items-start pb-[var(--spacing-0,0px)] pt-[var(--spacing-12,12px)] px-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6992" data-name="Comparison">
                    <div className="content-stretch flex flex-col gap-[var(--spacing-0,0px)] h-[112px] items-start pb-[var(--spacing-2,2px)] pt-[var(--spacing-14,14px)] relative shrink-0 w-full" data-node-id="189:6993" data-name="ELSA / Comparison chart / Crash rate">
                      <div className="absolute content-stretch flex gap-[var(--spacing-0,0px)] h-[86px] items-start left-[64px] p-[var(--spacing-0,0px)] right-[53.67px] top-0" data-node-id="189:6994" data-name="Scale grid">
                        <div className="bg-[var(--border,#e4e4e7)] h-[86px] relative shrink-0 w-px" data-node-id="189:6995" data-name="Zero baseline" />
                      </div>
                      <div className="content-stretch flex gap-[var(--spacing-8,8px)] h-[16px] items-center pl-[var(--spacing-0,0px)] pr-[54px] py-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:6997" data-name="Control">
                        <p className="font-normal leading-[14px] relative shrink-0 text-[10px] text-[color:var(--muted-foreground,#71717a)] w-[56px]" data-node-id="189:6998">
                          Control
                        </p>
                        <div className="content-stretch flex flex-[1_0_0] gap-[var(--spacing-0,0px)] h-[16px] items-start min-w-px p-[var(--spacing-0,0px)] relative" data-node-id="189:6999" data-name="Bar scale">
                          <div className="absolute content-stretch flex gap-[var(--spacing-0,0px)] h-[16px] items-start left-0 p-[var(--spacing-0,0px)] right-[6.67%] top-0" data-node-id="189:7000" data-name="Proportional bar · 0.933333">
                            <div className="flex-[1_0_0] h-[16px] min-w-px relative" data-node-id="189:7001" data-name="Value bar">
                              <DesignVector file="c7330" fit/>
                            </div>
                            <p className="absolute font-medium leading-[14px] right-[-8.64px] text-[10px] text-[color:var(--foreground,#09090b)] top-0 translate-x-full whitespace-nowrap" data-node-id="189:7002">
                              0.42%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="h-[26px] relative shrink-0 w-px" data-node-id="189:7003" data-name="Row gap" />
                      <div className="content-stretch flex gap-[var(--spacing-8,8px)] h-[16px] items-center pl-[var(--spacing-0,0px)] pr-[54px] py-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:7004" data-name="Treatment">
                        <p className="font-normal leading-[14px] relative shrink-0 text-[10px] text-[color:var(--muted-foreground,#71717a)] w-[56px]" data-node-id="189:7005">
                          Treatment
                        </p>
                        <div className="content-stretch flex flex-[1_0_0] gap-[var(--spacing-0,0px)] h-[16px] items-start min-w-px p-[var(--spacing-0,0px)] relative" data-node-id="189:7006" data-name="Bar scale">
                          <div className="absolute content-stretch flex gap-[var(--spacing-0,0px)] h-[16px] items-start left-0 p-[var(--spacing-0,0px)] right-[4.44%] top-0" data-node-id="189:7007" data-name="Proportional bar · 0.955556">
                            <div className="flex-[1_0_0] h-[16px] min-w-px relative" data-node-id="189:7008" data-name="Value bar">
                              <DesignVector file="d7079" fit/>
                            </div>
                            <p className="absolute font-medium leading-[14px] right-[-8.54px] text-[10px] text-[color:var(--foreground,#09090b)] top-0 translate-x-full whitespace-nowrap" data-node-id="189:7009">
                              0.43%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="h-[24px] relative shrink-0 w-px" data-node-id="189:7010" data-name="Axis gap" />
                      <div className="content-stretch flex font-normal gap-[var(--spacing-0,0px)] h-[14px] items-start justify-between leading-[14px] pl-[var(--spacing-64,64px)] pr-[54px] py-[var(--spacing-0,0px)] relative shrink-0 text-[10px] text-[color:var(--muted-foreground,#71717a)] w-full whitespace-nowrap" data-node-id="189:7011" data-name="Axis labels">
                        <p className="relative shrink-0" data-node-id="189:7012">
                          0%
                        </p>
                        <p className="relative shrink-0" data-node-id="189:7013">
                          0.45%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-[var(--background,white)] border border-[var(--border,#e4e4e7)] border-solid content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.08)] flex flex-[1_0_0] flex-col gap-[var(--spacing-12,12px)] items-start min-w-[280px] px-[var(--spacing-16,16px)] py-[var(--spacing-24,24px)] relative rounded-[var(--radius-14,14px)]" data-node-id="189:7014" data-name="Day 7 retention">
                  <div className="content-stretch flex gap-[var(--spacing-8,8px)] items-start p-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:7015" data-name="Heading">
                    <p className="flex-[1_0_0] font-semibold leading-[20px] min-w-px relative text-[14px] text-[color:var(--foreground,#09090b)]" data-node-id="189:7016">
                      Day 7 retention
                    </p>
                  </div>
                  <div className="content-stretch flex flex-col gap-[var(--spacing-4,4px)] items-start p-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:7017" data-name="Observed change">
                    <div className="content-center flex flex-wrap gap-[var(--spacing-12,4px_12px)] items-center min-h-[38px] p-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:7018" data-name="Delta and assessment">
                      <p className="font-semibold leading-[38px] relative shrink-0 text-[32px] text-[color:var(--adverse,#bd4916)] tracking-[-1.28px] whitespace-nowrap" data-node-id="189:7019">
                        -1.1 pp
                      </p>
                      <div className="bg-[var(--caution-soft,#fff0e1)] content-stretch flex gap-[var(--spacing-4,4px)] items-center px-[var(--spacing-8,8px)] py-[3px] relative rounded-[var(--radius-999,999px)] shrink-0" data-node-id="189:7020" data-name="ELSA / Status">
                        <p className="font-medium leading-[16px] relative shrink-0 text-[12px] text-[color:var(--caution,#995414)] whitespace-nowrap" data-node-id="I189:7020;143:28">
                          Negative
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border-[var(--border,#e4e4e7)] border-solid border-t content-stretch flex flex-col gap-[var(--spacing-0,0px)] items-start pb-[var(--spacing-0,0px)] pt-[var(--spacing-12,12px)] px-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:7021" data-name="Comparison">
                    <div className="content-stretch flex flex-col gap-[var(--spacing-0,0px)] h-[112px] items-start pb-[var(--spacing-2,2px)] pt-[var(--spacing-14,14px)] relative shrink-0 w-full" data-node-id="189:7022" data-name="ELSA / Comparison chart / Retention">
                      <div className="absolute content-stretch flex gap-[var(--spacing-0,0px)] h-[86px] items-start left-[64px] p-[var(--spacing-0,0px)] right-[53.67px] top-0" data-node-id="189:7023" data-name="Scale grid">
                        <div className="bg-[var(--border,#e4e4e7)] h-[86px] relative shrink-0 w-px" data-node-id="189:7024" data-name="Zero baseline" />
                      </div>
                      <div className="content-stretch flex gap-[var(--spacing-8,8px)] h-[16px] items-center pl-[var(--spacing-0,0px)] pr-[54px] py-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:7026" data-name="Control">
                        <p className="font-normal leading-[14px] relative shrink-0 text-[10px] text-[color:var(--muted-foreground,#71717a)] w-[56px]" data-node-id="189:7027">
                          Control
                        </p>
                        <div className="content-stretch flex flex-[1_0_0] gap-[var(--spacing-0,0px)] h-[16px] items-start min-w-px p-[var(--spacing-0,0px)] relative" data-node-id="189:7028" data-name="Bar scale">
                          <div className="absolute content-stretch flex gap-[var(--spacing-0,0px)] h-[16px] items-start left-0 p-[var(--spacing-0,0px)] right-[0.8%] top-0" data-node-id="189:7029" data-name="Proportional bar · 0.992000">
                            <div className="flex-[1_0_0] h-[16px] min-w-px relative" data-node-id="189:7030" data-name="Value bar">
                              <DesignVector file="0db30" fit/>
                            </div>
                            <p className="absolute font-medium leading-[14px] right-[-8.21px] text-[10px] text-[color:var(--foreground,#09090b)] top-0 translate-x-full whitespace-nowrap" data-node-id="189:7031">
                              24.8%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="h-[26px] relative shrink-0 w-px" data-node-id="189:7032" data-name="Row gap" />
                      <div className="content-stretch flex gap-[var(--spacing-8,8px)] h-[16px] items-center pl-[var(--spacing-0,0px)] pr-[54px] py-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:7033" data-name="Treatment">
                        <p className="font-normal leading-[14px] relative shrink-0 text-[10px] text-[color:var(--muted-foreground,#71717a)] w-[56px]" data-node-id="189:7034">
                          Treatment
                        </p>
                        <div className="content-stretch flex flex-[1_0_0] gap-[var(--spacing-0,0px)] h-[16px] items-start min-w-px p-[var(--spacing-0,0px)] relative" data-node-id="189:7035" data-name="Bar scale">
                          <div className="absolute content-stretch flex gap-[var(--spacing-0,0px)] h-[16px] items-start left-0 p-[var(--spacing-0,0px)] right-[5.2%] top-0" data-node-id="189:7036" data-name="Proportional bar · 0.948000">
                            <div className="flex-[1_0_0] h-[16px] min-w-px relative" data-node-id="189:7037" data-name="Value bar">
                              <DesignVector file="74ca2" fit/>
                            </div>
                            <p className="absolute font-medium leading-[14px] right-[-7.54px] text-[10px] text-[color:var(--foreground,#09090b)] top-0 translate-x-full whitespace-nowrap" data-node-id="189:7038">
                              23.7%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="h-[24px] relative shrink-0 w-px" data-node-id="189:7039" data-name="Axis gap" />
                      <div className="content-stretch flex font-normal gap-[var(--spacing-0,0px)] h-[14px] items-start justify-between leading-[14px] pl-[var(--spacing-64,64px)] pr-[54px] py-[var(--spacing-0,0px)] relative shrink-0 text-[10px] text-[color:var(--muted-foreground,#71717a)] w-full whitespace-nowrap" data-node-id="189:7040" data-name="Axis labels">
                        <p className="relative shrink-0" data-node-id="189:7041">
                          0%
                        </p>
                        <p className="relative shrink-0" data-node-id="189:7042">
                          25%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content-center flex flex-wrap gap-[var(--spacing-8,8px)] items-center p-[var(--spacing-0,0px)] relative shrink-0 w-full" data-node-id="189:7043" data-name="Suggested questions">
            <PromptSuggestion className="h-auto min-h-0 shadow-none px-4 py-2 text-sm leading-5 font-medium rounded-full" data-node-id="189:7044" onClick={() => onAsk('Why did onboarding latency increase?', [])}>Why did onboarding latency increase?</PromptSuggestion>
            <PromptSuggestion className="h-auto min-h-0 shadow-none px-4 py-2 text-sm leading-5 font-medium rounded-full" data-node-id="189:7045" onClick={() => onAsk('Why is cancellation rising?', [])}>Why is cancellation rising?</PromptSuggestion>
            <PromptSuggestion className="h-auto min-h-0 shadow-none px-4 py-2 text-sm leading-5 font-medium rounded-full" data-node-id="189:7046" onClick={() => onAsk('What should we validate next?', [])}>What should we validate next?</PromptSuggestion>
          </div>
        </div>
        <DesignReportSections onAsk={onAsk} onEvidence={onEvidence} branch={branch} data={data} onAction={onAction}/>
      </div>); }
