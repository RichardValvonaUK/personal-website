<?php
// src/Controller/ErrorController.php
namespace App\Controller;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Log\DebugLoggerInterface;

class ErrorController extends BaseController
{
	public function show(\Throwable $exception, ?DebugLoggerInterface $logger) : Response {
		return $this->render('bundles/TwigBundle/Exception/error404.html.twig');
	}
}