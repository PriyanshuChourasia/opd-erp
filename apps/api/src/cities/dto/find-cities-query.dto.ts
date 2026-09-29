import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * GET /cities supports three shapes:
 *  - no params          → full active catalog
 *  - state=West Bengal   → cities for one state (feeds the city select)
 *  - name + state        → find-or-create that pair, returned as [city]
 *                           (called as someone types a new city name)
 */
export class FindCitiesQueryDto {
  @IsOptional()
  @IsString()
  /** Filter by state name (e.g. "West Bengal"). */
  state?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  /** City name — combined with `state` triggers find-or-create. */
  name?: string;

  @IsOptional()
  @IsString()
  /** Case-insensitive search across city and state names. */
  search?: string;
}
