import db from '../../db/connection.ts';
import mediaRepository from './media.repository.ts';

import type { Media, NewMedia } from './media.types.ts';
import type { DB } from '../../shared/types/index.ts';

export async function create(m: NewMedia, executor: DB = db): Promise<Media> {
  return await mediaRepository.create(m, executor);
}

export async function createMany(items: NewMedia[], executor: DB = db): Promise<Media[]> {
  return await mediaRepository.createMany(items, executor);
}

export async function findById(id: number, executor: DB = db): Promise<Media | undefined> {
  return await mediaRepository.findById(id, executor);
}

export async function update(id: number, patch: Partial<NewMedia>, executor: DB = db): Promise<Media | undefined> {
  return await mediaRepository.update(id, { ...patch, updatedAt: new Date() }, executor);
}

export async function deleteMedia(ids: number[], executor: DB = db): Promise<Media[]> {
  return await mediaRepository.delete(ids, executor);
}

export async function findByIds(ids: number[], executor: DB = db): Promise<Media[]> {
  return await mediaRepository.findByIds(ids, executor);
}

const MediaService = {
  create,
  createMany,
  findById,
  update,
  deleteMedia,
  findByIds,
};

export default MediaService;
