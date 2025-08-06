import mongoose from 'mongoose';
import { Tag } from 'shared/types/Tag';

const tagSchema = new mongoose.Schema<Tag>({
  label: { type: String, required: true },
  key: { type: String, required: true },
  colour: { type: String, required: true },
  group: { type: String, default: 'Ungrouped' },
}, {
  timestamps: true,
}
);

const TagModel = mongoose.model<Tag>('Tag', tagSchema);
export default TagModel;
