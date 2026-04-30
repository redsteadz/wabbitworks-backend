const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

const clone = (value) => JSON.parse(JSON.stringify(value));

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const normalizePath = (path) => path.replace(/\{[^}]+\}/g, '{}');

const resolveRef = (spec, ref) => {
  if (!ref || typeof ref !== 'string' || !ref.startsWith('#/')) {
    return null;
  }

  const parts = ref.replace(/^#\//, '').split('/');
  let current = spec;

  for (const part of parts) {
    current = current?.[part];
    if (current === undefined) {
      return null;
    }
  }

  return clone(current);
};

const sampleFromSchema = (schema, spec, depth = 0) => {
  if (!schema || depth > 8) {
    return undefined;
  }

  if (schema.$ref) {
    return sampleFromSchema(resolveRef(spec, schema.$ref), spec, depth + 1);
  }

  if (schema.example !== undefined) {
    return clone(schema.example);
  }

  if (schema.default !== undefined) {
    return clone(schema.default);
  }

  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return clone(schema.enum[0]);
  }

  if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
    return schema.allOf.reduce((accumulator, item) => {
      const nextValue = sampleFromSchema(item, spec, depth + 1);
      if (isPlainObject(nextValue)) {
        return { ...accumulator, ...nextValue };
      }
      return accumulator;
    }, {});
  }

  if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
    return sampleFromSchema(schema.oneOf[0], spec, depth + 1);
  }

  if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
    return sampleFromSchema(schema.anyOf[0], spec, depth + 1);
  }

  switch (schema.type) {
    case 'object': {
      const result = {};
      const properties = schema.properties || {};
      const keys = [
        ...new Set([
          ...Object.keys(properties),
          ...(Array.isArray(schema.required) ? schema.required : []),
        ]),
      ];

      for (const key of keys) {
        const nextValue = sampleFromSchema(properties[key], spec, depth + 1);
        if (nextValue !== undefined) {
          result[key] = nextValue;
        }
      }

      return result;
    }

    case 'array': {
      const sampleItem = sampleFromSchema(schema.items, spec, depth + 1);
      return sampleItem === undefined ? [] : [sampleItem];
    }

    case 'boolean':
      return true;

    case 'integer':
    case 'number':
      return 1;

    case 'string':
      if (schema.format === 'email') {
        return 'jane.doe@example.com';
      }

      if (schema.format === 'uuid') {
        return '123e4567-e89b-12d3-a456-426614174000';
      }

      if (schema.format === 'date') {
        return '2026-04-22';
      }

      if (schema.format === 'date-time') {
        return new Date().toISOString();
      }

      if (schema.format === 'uri') {
        return 'https://example.com/resource';
      }

      if (schema.format === 'binary') {
        return '<file>';
      }

      if (schema.enum && schema.enum.length > 0) {
        return clone(schema.enum[0]);
      }

      return 'string';

    default:
      if (schema.nullable) {
        return null;
      }

      if (isPlainObject(schema.properties)) {
        return sampleFromSchema({ type: 'object', properties: schema.properties }, spec, depth + 1);
      }

      return undefined;
  }
};

const parameterSample = (parameter, spec) => {
  const schema = parameter.schema || {};
  const sample = sampleFromSchema(schema, spec);
  const lowerName = String(parameter.name || '').toLowerCase();

  if (sample !== undefined && sample !== null) {
    if (typeof sample === 'object') {
      return JSON.stringify(sample);
    }

    return String(sample);
  }

  switch (schema.format) {
    case 'uuid':
      return '123e4567-e89b-12d3-a456-426614174000';
    case 'email':
      return 'jane.doe@example.com';
    case 'date':
      return '2026-04-22';
    case 'date-time':
      return new Date().toISOString();
    default:
      if (lowerName === 'token') {
        return 'replace-with-token';
      }

      if (lowerName === 'page') {
        return '1';
      }

      if (lowerName === 'limit') {
        return '20';
      }

      if (lowerName === 'days') {
        return '3';
      }

      if (lowerName === 'search') {
        return 'login';
      }

      if (lowerName === 'is_read') {
        return 'false';
      }

      if (lowerName === 'assigned_to_me') {
        return 'true';
      }

      return parameter.example !== undefined ? String(parameter.example) : 'string';
  }
};

const buildFormData = (schema, spec) => {
  const resolvedSchema = schema?.$ref ? resolveRef(spec, schema.$ref) : schema;
  const properties = resolvedSchema?.properties || {};
  const required = new Set(Array.isArray(resolvedSchema?.required) ? resolvedSchema.required : []);
  const fields = [];

  for (const [key, propertySchema] of Object.entries(properties)) {
    const sample = sampleFromSchema(propertySchema, spec);

    if (propertySchema?.format === 'binary') {
      fields.push({
        key,
        type: 'file',
        src: '',
        disabled: false,
        description: propertySchema.description || undefined,
      });
      continue;
    }

    if (sample === undefined && !required.has(key)) {
      continue;
    }

    fields.push({
      key,
      value: sample === undefined || sample === null ? '' : String(sample),
      type: 'text',
      disabled: false,
      description: propertySchema?.description || undefined,
    });
  }

  return fields;
};

const buildQueryParameters = (operation, spec) => {
  const parameters = operation.parameters || [];

  return parameters
    .filter((parameter) => parameter.in === 'query')
    .map((parameter) => ({
      key: parameter.name,
      value: parameterSample(parameter, spec),
      description: parameter.description,
      disabled: false,
    }));
};

const collectPathParameters = (spec) => {
  const names = new Set(['cookieSessionId']);

  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    const matches = path.match(/\{([^}]+)\}/g) || [];
    for (const match of matches) {
      names.add(match.slice(1, -1));
    }

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) {
        continue;
      }

      for (const parameter of operation.parameters || []) {
        if (parameter.in === 'path') {
          names.add(parameter.name);
        }
      }
    }
  }

  return Array.from(names);
};

const defaultVariableValue = (name) => {
  if (name === 'baseUrl') {
    return 'http://localhost:5000/api';
  }

  if (name === 'cookieSessionId') {
    return 'replace-with-session-cookie';
  }

  if (name === 'days') {
    return '3';
  }

  if (name === 'token') {
    return 'replace-with-token';
  }

  if (name.toLowerCase().includes('id')) {
    return '123e4567-e89b-12d3-a456-426614174000';
  }

  return `replace-with-${name}`;
};

const buildRequestBody = (operation, spec) => {
  const content = operation.requestBody?.content || {};
  const preferredContentType = [
    'multipart/form-data',
    'application/json',
    'application/x-www-form-urlencoded',
  ].find((type) => content[type]);

  if (!preferredContentType) {
    return null;
  }

  const schema = content[preferredContentType].schema;

  if (preferredContentType === 'multipart/form-data') {
    return {
      mode: 'formdata',
      formdata: buildFormData(schema, spec),
    };
  }

  const sample = sampleFromSchema(schema, spec);

  return {
    mode: 'raw',
    raw: JSON.stringify(sample ?? {}, null, 2),
    options: {
      raw: {
        language: 'json',
      },
    },
  };
};

const buildHeaders = (operation, hasJsonBody) => {
  const headers = [
    {
      key: 'Accept',
      value: 'application/json',
    },
  ];

  const requiresCookie = Array.isArray(operation.security)
    && operation.security.some((scheme) => Object.prototype.hasOwnProperty.call(scheme, 'sessionAuth'));

  if (requiresCookie) {
    headers.push({
      key: 'Cookie',
      value: 'sessionId={{cookieSessionId}}',
    });
  }

  if (hasJsonBody) {
    headers.push({
      key: 'Content-Type',
      value: 'application/json',
    });
  }

  return headers;
};

const buildRequestUrl = (path, operation, spec) => {
  const rawPath = path.replace(/\{([^}]+)\}/g, '{{$1}}');

  return {
    raw: `{{baseUrl}}${rawPath}`,
    query: buildQueryParameters(operation, spec),
  };
};

const buildRequest = (operation, spec, method, path) => {
  const body = buildRequestBody(operation, spec);
  const hasJsonBody = body?.mode === 'raw';

  return {
    name: operation.summary || `${method.toUpperCase()} ${path}`,
    request: {
      method: method.toUpperCase(),
      header: buildHeaders(operation, hasJsonBody),
      url: buildRequestUrl(path, operation, spec),
      description: operation.description || operation.summary,
      body: body || undefined,
    },
    response: [],
  };
};

const buildPostmanCollection = (spec) => {
  const baseUrl = spec.servers?.[0]?.url || 'http://localhost:5000/api';
  const folders = new Map();
  const seenOperations = new Set();
  const tagOrder = Array.isArray(spec.tags) ? spec.tags.map((tag) => tag.name) : [];

  for (const path of Object.keys(spec.paths || {}).sort()) {
    const pathItem = spec.paths[path];

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) {
        continue;
      }

      const normalizedKey = `${method.toUpperCase()} ${normalizePath(path)}`;
      if (seenOperations.has(normalizedKey)) {
        continue;
      }
      seenOperations.add(normalizedKey);

      const tag = operation.tags?.[0] || 'Misc';
      const item = buildRequest(operation, spec, method, path);

      if (!folders.has(tag)) {
        folders.set(tag, []);
      }

      folders.get(tag).push(item);
    }
  }

  const orderedTags = [
    ...tagOrder.filter((tag) => folders.has(tag)),
    ...Array.from(folders.keys()).filter((tag) => !tagOrder.includes(tag)).sort(),
  ];

  return {
    info: {
      name: spec.info?.title || 'API Collection',
      description: `${spec.info?.description || ''}\n\nGenerated from the OpenAPI spec. Use the baseUrl variable for the backend URL and cookieSessionId for authenticated requests.`,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [
      {
        key: 'baseUrl',
        value: baseUrl,
        type: 'string',
      },
      {
        key: 'cookieSessionId',
        value: defaultVariableValue('cookieSessionId'),
        type: 'string',
      },
      ...collectPathParameters(spec)
        .filter((name) => name !== 'cookieSessionId')
        .sort()
        .map((name) => ({
          key: name,
          value: defaultVariableValue(name),
          type: 'string',
        })),
    ],
    item: orderedTags.map((tag) => ({
      name: tag,
      item: folders.get(tag).sort((left, right) => left.name.localeCompare(right.name)),
    })),
  };
};

const sendJsonDocument = (res, document, filename, download = false) => {
  if (download) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(document, null, 2));
};

module.exports = {
  buildPostmanCollection,
  sendJsonDocument,
  sampleFromSchema,
};
