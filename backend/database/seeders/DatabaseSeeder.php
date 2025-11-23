public function run(): void
{
    $this->call([
        SpaceSeeder::class,     // el que ya tenías
        TestDataSeeder::class,  // nuevo
    ]);
}
