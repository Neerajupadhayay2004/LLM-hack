import { generateObject, streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

export interface AnalysisResult {
  answer: string
  confidence: number
  reasoning: string
  evidence: string[]
  recommendations: string[]
  risk_assessment?: string
  compliance_status?: "compliant" | "non-compliant" | "unclear"
  action_items?: string[]
}

export class AdvancedLLMService {
  private model = openai("gpt-4o")

  async analyzeDocument(
    context: string,
    query: string,
    domain: "insurance" | "legal" | "hr" | "compliance",
  ): Promise<AnalysisResult> {
    const systemPrompts = {
      insurance: `You are an expert insurance policy analyst with deep knowledge of:
        - Policy terms and conditions
        - Coverage analysis and exclusions
        - Claims processing and settlements
        - Regulatory compliance (IRDAI, state regulations)
        - Risk assessment and underwriting principles
        
        Analyze the provided context with focus on:
        - Coverage scope and limitations
        - Waiting periods and conditions
        - Premium calculations and discounts
        - Claim procedures and exclusions
        - Regulatory compliance requirements`,

      legal: `You are a senior legal analyst specializing in:
        - Contract analysis and interpretation
        - Legal precedents and case law
        - Regulatory compliance
        - Risk assessment and liability
        - Legal procedure and documentation
        
        Focus your analysis on:
        - Legal validity and enforceability
        - Rights and obligations of parties
        - Potential legal risks and exposures
        - Compliance with applicable laws
        - Procedural requirements`,

      hr: `You are an HR policy expert with expertise in:
        - Employment law and regulations
        - HR policies and procedures
        - Employee rights and benefits
        - Performance management
        - Workplace compliance and safety
        
        Analyze with attention to:
        - Policy compliance and fairness
        - Employee rights and protections
        - Legal requirements (labor laws, EEOC)
        - Best practices and recommendations
        - Risk mitigation strategies`,

      compliance: `You are a compliance officer with specialization in:
        - Regulatory frameworks and requirements
        - Risk assessment and management
        - Audit procedures and controls
        - Policy implementation and monitoring
        - Violation detection and remediation
        
        Focus on:
        - Regulatory compliance status
        - Control effectiveness
        - Risk identification and assessment
        - Remediation recommendations
        - Monitoring and reporting requirements`,
    }

    const responseSchema = z.object({
      answer: z.string().describe("Direct answer to the query"),
      confidence: z.number().min(0).max(1).describe("Confidence level in the answer"),
      reasoning: z.string().describe("Detailed reasoning behind the answer"),
      evidence: z.array(z.string()).describe("Supporting evidence from the context"),
      recommendations: z.array(z.string()).describe("Actionable recommendations"),
      risk_assessment: z.string().optional().describe("Risk assessment if applicable"),
      compliance_status: z.enum(["compliant", "non-compliant", "unclear"]).optional(),
      action_items: z.array(z.string()).optional().describe("Specific action items"),
    })

    const { object } = await generateObject({
      model: this.model,
      system: systemPrompts[domain],
      prompt: `
        Context Document:
        ${context}
        
        Query: ${query}
        
        Provide a comprehensive analysis addressing the query based on the context provided.
        Include specific references to relevant sections and provide actionable insights.
      `,
      schema: responseSchema,
    })

    return object
  }

  async compareDocuments(documents: Array<{ title: string; content: string }>, comparisonCriteria: string[]) {
    const comparisonSchema = z.object({
      summary: z.string().describe("Overall comparison summary"),
      similarities: z.array(z.string()).describe("Key similarities between documents"),
      differences: z
        .array(
          z.object({
            criteria: z.string(),
            document1: z.string(),
            document2: z.string(),
            significance: z.enum(["high", "medium", "low"]),
          }),
        )
        .describe("Key differences between documents"),
      recommendations: z.array(z.string()).describe("Recommendations based on comparison"),
      compliance_gaps: z.array(z.string()).optional().describe("Compliance gaps identified"),
    })

    const { object } = await generateObject({
      model: this.model,
      system: `You are a document comparison expert. Compare the provided documents based on the specified criteria and identify key similarities, differences, and implications.`,
      prompt: `
        Documents to Compare:
        ${documents.map((doc, i) => `Document ${i + 1} (${doc.title}):\n${doc.content}`).join("\n\n")}
        
        Comparison Criteria:
        ${comparisonCriteria.join("\n")}
        
        Provide a detailed comparison analysis focusing on the specified criteria.
      `,
      schema: comparisonSchema,
    })

    return object
  }

  async generateInsights(
    documents: string[],
    domain: string,
    analysisType: "trends" | "gaps" | "risks" | "opportunities",
  ) {
    const insightSchema = z.object({
      key_insights: z.array(z.string()).describe("Main insights discovered"),
      trends: z
        .array(
          z.object({
            trend: z.string(),
            impact: z.enum(["high", "medium", "low"]),
            timeframe: z.string(),
          }),
        )
        .optional(),
      risk_factors: z
        .array(
          z.object({
            risk: z.string(),
            probability: z.enum(["high", "medium", "low"]),
            impact: z.enum(["high", "medium", "low"]),
            mitigation: z.string(),
          }),
        )
        .optional(),
      opportunities: z.array(z.string()).optional(),
      recommendations: z.array(
        z.object({
          priority: z.enum(["high", "medium", "low"]),
          action: z.string(),
          expected_outcome: z.string(),
        }),
      ),
    })

    const { object } = await generateObject({
      model: this.model,
      system: `You are an expert analyst specializing in ${domain} domain analysis. Generate comprehensive insights from the provided documents focusing on ${analysisType}.`,
      prompt: `
        Analyze the following documents and generate insights focused on ${analysisType}:
        
        ${documents.join("\n\n---\n\n")}
        
        Provide actionable insights, identify patterns, and suggest improvements based on your analysis.
      `,
      schema: insightSchema,
    })

    return object
  }

  async streamAnalysis(context: string, query: string, onChunk: (chunk: string) => void) {
    const result = streamText({
      model: this.model,
      system: `You are an expert document analyst. Provide a comprehensive, step-by-step analysis of the query based on the provided context.`,
      prompt: `Context: ${context}\n\nQuery: ${query}\n\nProvide a detailed analysis:`,
    })

    for await (const chunk of result.textStream) {
      onChunk(chunk)
    }

    return await result.text
  }

  async extractEntities(text: string) {
    const entitySchema = z.object({
      persons: z.array(z.string()).describe("Person names mentioned"),
      organizations: z.array(z.string()).describe("Organization names"),
      locations: z.array(z.string()).describe("Location names"),
      dates: z.array(z.string()).describe("Important dates"),
      amounts: z.array(z.string()).describe("Monetary amounts or percentages"),
      legal_terms: z.array(z.string()).describe("Legal or technical terms"),
      key_concepts: z.array(z.string()).describe("Important concepts or themes"),
    })

    const { object } = await generateObject({
      model: this.model,
      system: `You are an expert in named entity recognition and information extraction. Extract all relevant entities from the provided text.`,
      prompt: `Extract all relevant entities from this text:\n\n${text}`,
      schema: entitySchema,
    })

    return object
  }
}
