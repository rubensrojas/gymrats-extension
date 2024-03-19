export interface Activity {
  id: number
  version: string
  description: any
  title: string
  duration: number
  media: Medum[]
  points: any
  account: Account
  steps: any
  calories: any
  duration_millis: number
  distance: string
  activity_metric_amount: any
  challenge_id: number
  gym_rats_user_id: number
  workout_activities: any
  photo_url: string
  created_at: string
  activity_type: any
  occurred_at: string
  activity_count: number
  apple_device_name: any
  apple_source_name: any
  apple_workout_uuid: any
  google_place_id: any
  activity: any
  formatted_details: FormattedDetails
}

export interface Medum {
  id: number
  width: number
  source: string
  url: string
  height: number
  medium_type: string
  thumbnail_url: any
  aspect_ratio: number
}

export interface Account {
  id: number
  email: string
  profile_picture_url: string
  full_name: string
}

export interface FormattedDetails {
  duration: string
  points: any
  steps: any
  calories: any
  duration_millis: string
  distance: string
  activity_metric_amount: any
}
