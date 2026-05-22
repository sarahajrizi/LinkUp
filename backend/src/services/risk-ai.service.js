import OpenAI from 'openai';
import { env } from '../config/env.js';

let openaiClient;

function client() {
  if (!env.openaiApiKey) {
    const error = new Error('OpenAI API key is not configured. Add OPENAI_API_KEY or OPEN_AI_API in .env.');
    error.status = 503;
    throw error;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: env.openaiApiKey });
  }
  return openaiClient;
}

function compactRows(rows, fields) {
  return rows.slice(0, 30).map((row) => {
    const item = {};
    for (const field of fields) {
      item[field] = row[field] ?? null;
    }
    return item;
  });
}

export function buildRiskPayload({ child, records, score, level, reasons }) {
  return {
    child: {
      id: child.id,
      fullName: child.full_name,
      dateOfBirth: child.date_of_birth,
      gender: child.gender,
      municipality: child.municipality,
    },
    ruleBasedRisk: {
      score,
      level,
      reasons,
    },
    healthRecords: {
      vaccinations: compactRows(records.vaccinations, [
        'vaccine_name',
        'recommended_date',
        'scheduled_date',
        'completed_date',
        'status',
      ]),
      checkups: compactRows(records.checkups, [
        'checkup_type',
        'scheduled_date',
        'completed_date',
        'notes',
        'status',
      ]),
      milestones: compactRows(records.milestones, [
        'milestone_name',
        'expected_age_months',
        'achieved_date',
        'notes',
        'status',
      ]),
      appointments: compactRows(records.appointments, [
        'type',
        'scheduled_at',
        'location',
        'status',
        'parent_response',
        'notes',
      ]),
      homeVisits: compactRows(records.visits, [
        'scheduled_at',
        'completed_at',
        'status',
        'temperature',
        'weight_kg',
        'height_cm',
        'symptoms',
        'risk_notes',
        'risk_level',
      ]),
    },
  };
}

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    keyReasons: {
      type: 'array',
      items: { type: 'string' },
    },
    recommendedActions: {
      type: 'array',
      items: { type: 'string' },
    },
    urgency: {
      type: 'string',
      enum: ['routine', 'within_30_days', 'within_7_days', 'urgent'],
    },
    parentFriendlyMessage: { type: 'string' },
    providerNotes: { type: 'string' },
  },
  required: [
    'summary',
    'keyReasons',
    'recommendedActions',
    'urgency',
    'parentFriendlyMessage',
    'providerNotes',
  ],
};

export async function generateRiskInsight(payload) {
  const response = await client().responses.create({
    model: env.openaiModel,
    input: [
      {
        role: 'system',
        content:
          'You support SAFE, a preventive child health monitoring system. Use only the provided record data. Do not diagnose, prescribe medication, or replace clinical judgment. Flag preventive follow-up needs clearly and recommend provider review when risk is not low.',
      },
      {
        role: 'user',
        content: `Analyze this child preventive-care record and return JSON only:\n${JSON.stringify(payload)}`,
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'safe_child_risk_insight',
        strict: true,
        schema: responseSchema,
      },
    },
  });

  if (!response.output_text) {
    const error = new Error('OpenAI did not return an analysis result.');
    error.status = 502;
    throw error;
  }

  return JSON.parse(response.output_text);
}
