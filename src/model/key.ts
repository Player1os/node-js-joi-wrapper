// Load app modules.
import { Model } from '.../src/model'

// Load scoped modules.
import { KnexWrapper } from '@player1os/knex-wrapper'

// Load npm modules.
import * as Joi from 'joi'
import * as Knex from 'knex'
import * as lodash from 'lodash'

// Expose the type that defines the table key.
export type TKey = number | string

// Expose the base model class.
export abstract class KeyModel<
	IEntity extends { key: TKey },
	ICreateValues extends object,
	IUpdateValues extends object,
	IQueryItem extends { key?: TKey }
	> extends Model<IEntity, ICreateValues, IUpdateValues, IQueryItem> {
	/**
	 * A constructor that confirms that the required properties are present.
	 * @param knexWrapper The object containing the knex instance.
	 * @param table The name of the underlying table.
	 * @param fields The names and validation schemas of the table's fields.
	 */
	constructor(
		knexWrapper: KnexWrapper,
		table: string,
		fields: {
			key: Joi.NumberSchema | Joi.StringSchema,
			[fieldName: string]: Joi.BooleanSchema | Joi.NumberSchema | Joi.StringSchema | Joi.ObjectSchema | Joi.DateSchema,
		},
	) {
		// Call the parent constructor.
		super(knexWrapper, table, fields,
			// Define validator from the schema for the create values.
			// - all required fields must be present.
			// - all specified keys must correspond to fields.
			// - all present fields must conform to the given rules.
			Joi.object(lodash.pickBy(fields, (_value, key) => {
				return key !== 'key'
			}) as Joi.SchemaMap).options({
				abortEarly: false,
				convert: false,
				presence: 'required',
			}),
			// Define validator from the schema for the update values.
			// - all specified keys must correspond to fields.
			// - all present fields must conform to the given rules.
			Joi.object(lodash.pickBy(fields, (_value, key) => {
				return key !== 'key'
			}) as Joi.SchemaMap).options({
				abortEarly: false,
				convert: false,
				presence: 'optional',
			}),
		)

		// Verify whether a fields object contains the primary key.
		if (!this.fields.key) {
			throw new Error('The submitted fields object does not contain a primary key entry.')
		}
	}

	/**
	 * All fields present in the underlying data object, a parameter specifies whether this includes the primary key.
	 * @param isKeyExcluded Specifies whether the primary key should be present.
	 */
	fieldNames(isKeyExcluded?: boolean) {
		const baseFieldNames = super.fieldNames()
		return isKeyExcluded
			? baseFieldNames.filter((baseFieldName) => {
				return baseFieldName !== 'key'
			})
			: baseFieldNames
	}

	/**
	 * Find a single entity of the model matching the key.
	 * @param key
	 * @param options
	 */
	async findByKey(key: TKey, options: {
		isValidationDisabled?: boolean,
		orderBy?: [{
			column: string,
			direction: string,
		}],
		limit?: number,
		offset?: number,
		transaction?: Knex.Transaction,
	} = {}) {
		// Call the find one method with only the key in the query.
		return this.findOne({ key } as IQueryItem, options)
	}

	/**
	 * Update a single entity of the model matching the key with the supplied values.
	 * @param key
	 * @param values
	 * @param options
	 */
	async updateByKey(key: TKey, values: IUpdateValues, options: {
		isQueryValidationDisabled?: boolean,
		isValuesValidationDisabled?: boolean,
		transaction?: Knex.Transaction,
	} = {}) {
		// Call the update one method with only the key in the query.
		return this.updateOne({ key } as IQueryItem, values, options)
	}

	/**
	 * Destroy a single entity of the model matching the key.
	 * @param key
	 * @param options
	 */
	async destroyByKey(key: TKey, options: {
		isValidationDisabled?: boolean,
		transaction?: Knex.Transaction,
	} = {}) {
		// Call the destroy one method with only the key in the query.
		return this.destroyOne({ key } as IQueryItem, options)
	}

	/**
	 * Update the entity indicated by the primary key that's part of the given document.
	 * @param document
	 * @param options
	 */
	async save(document: IEntity, options: {
		isQueryValidationDisabled?: boolean,
		isValuesValidationDisabled?: boolean,
		transaction?: Knex.Transaction,
	} = {}) {
		// Update the entity with the given document key using the given document values.
		return this.updateByKey(document.key, lodash.pick(document, this.fieldNames()) as IUpdateValues, options)
	}

	/**
	 * Destroy the entity indicated by the primary key that's part of the given document.
	 * @param document
	 * @param options
	 */
	async delete(document: IEntity, options: {
		isValidationDisabled?: boolean,
		transaction?: Knex.Transaction,
	} = {}) {
		// Destroy the entity with the given document key.
		return this.destroyByKey(document.key, options)
	}
}
