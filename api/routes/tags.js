// api/routes/tags.js — /panel/tags and /panel/templates — ad tags and the ad unit templates
// behind them. Both resolve live (no publish plane).
import express from 'express';
import * as store from '../store.js';
import { handle } from '../error-handler.js';
import { tagView, templateView } from '../response-shapes.js';

const r = express.Router();

r.get('/panel/tags', handle((req, res) => {
  res.json({ tags: store.listTags().map(tagView) });
}));

r.get('/panel/tags/:id', handle((req, res) => {
  res.json({ tag: tagView(store.getTag(req.params.id)) });
}));

r.post('/panel/tags', handle((req, res) => {
  const obj = store.createTag(req.body);
  res.status(201).json({ tag: tagView(obj) });
}));

r.patch('/panel/tags/:id', handle((req, res) => {
  const { obj, changes } = store.updateTag(req.params.id, req.body);
  res.json({ tag: tagView(obj), changes });
}));

r.delete('/panel/tags/:id', handle((req, res) => {
  const obj = store.deleteTag(req.params.id);
  res.json({ deleted: obj.id });
}));

r.get('/panel/templates', handle((req, res) => {
  res.json({ templates: store.listTemplates().map(templateView) });
}));

r.post('/panel/templates', handle((req, res) => {
  res.status(201).json({ template: templateView(store.createTemplate(req.body)) });
}));

r.patch('/panel/templates/:id', handle((req, res) => {
  const { obj, changes } = store.updateTemplate(req.params.id, req.body);
  res.json({ template: templateView(obj), changes });
}));

r.delete('/panel/templates/:id', handle((req, res) => {
  const obj = store.deleteTemplate(req.params.id);
  res.json({ deleted: obj.id });
}));

export default r;
